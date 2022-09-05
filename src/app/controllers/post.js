const s3Service = require("../services/s3");
const postSqlQuerys = require("../db/queries/post").queryList;
const dbConnection = require("../db/connection");
var slugify = require("slugify");
const readTime = require("../services/readingTime");
const rediConnection = require("../startup/redis");

/**
 * @desc    Create new post
 * @route   Post /api/v1/post
 * @access  Private
 */
module.exports.create = async (req, res) => {
  let data = req.body;
  // add estimated reading time to data
  data.readTime = await readTime(data.md);
  //check if tag alreedy exist
  const tags = data.tags;
  for (id of tags) {
    let result = await dbConnection.query(postSqlQuerys.CHECK_IF_TAG_EXIST, [
      id,
    ]);
    if (result.rows[0].exists != true)
      return res
        .status(400)
        .json({ message: "Tag No valid entry found for provided ID" });
  }

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  let post_id;
  try {
    await dbConnection.query("BEGIN");
    result = await dbConnection.query(postSqlQuerys.CREATE_NEW_POST, [
      data.title,
      slugify(data.slug, "_"),
      data.excerpt,
      data.md,
      req.user._id,
      data.tags,
      data.readTime,
    ]);
    post_id = result.rows[0]._id;

    //   insert  post_tag row for m to m relsh
    for (id of tags)
      await dbConnection.query(postSqlQuerys.CREATE_POST_TAG_REL, [
        post_id,
        id,
      ]);

    await dbConnection.query("COMMIT");
  } catch (err) {
    console.log(err.message);
    await dbConnection.query("ROLLBACK");

    return res.status(400).json({ message: err.message });
  }

  if (result.rowCount == 0)
    return res
      .status(400)
      .json({ message: "Can not create this post for unknown reasons" });

  res.status(201).json({ message: "post created" });
};

/**
 * @desc    Upload post cover image
 * @route   POST /api/v1/post/cover/image/:id
 * @access  Private [ admin - author ]
 */
exports.uploadCoverImage = async (req, res) => {
  // get old image  S3Key if image exist
  const postCoverImageS3Key = await dbConnection.query(
    postSqlQuerys.GET_POST_COVER_IMAGE_S3_KEY,
    [req.params.id]
  );

  if (postCoverImageS3Key.rowCount == 0)
    return res
      .status(400)
      .json({ message: "No valid entry found for provided ID" });

  // upload new image to aws S3
  const imageData = await s3Service.uploadFile("postCovers/", req.file);

  //  update accountby new image data
  await dbConnection.query(postSqlQuerys.UPDATE_POST_COVER_IMAGE, [
    imageData.fileLink,
    imageData.s3_key,
    req.params.id,
  ]);

  //  if image data have s3_key then this account have old image then delete this from aws
  if (postCoverImageS3Key.rows[0].s3_key !== null) {
    //  delete old image file from aws
    await s3Service.deleteOne(postCoverImageS3Key.rows[0]);
  }

  res.status(200).json({
    message: "Successful upload",
    link: imageData.fileLink,
  });
};

/**
 * @desc    Reset post cover image
 * @route   POST /api/v1/post/cover/image/reset/:id
 * @access  Private [ admin - author ]
 */
exports.resetCoverImage = async (req, res) => {
  // get old image  S3Key if image exist
  const postCoverImageS3Key = await dbConnection.query(
    postSqlQuerys.GET_POST_COVER_IMAGE_S3_KEY,
    [req.params.id]
  );
  if (postCoverImageS3Key.rowCount == 0)
    return res
      .status(400)
      .json({ message: "No valid entry found for provided ID" });

  //  if image data have s3_key then this account have old image then delete this from aws
  if (postCoverImageS3Key.rows[0].s3_key !== null) {
    await dbConnection.query(postSqlQuerys.UPDATE_POST_COVER_IMAGE, [
      null,
      null,
      req.params.id,
    ]);
  }

  res.status(200).json({
    message: "Successful reset",
  });

  if (postCoverImageS3Key.rows[0].s3_key !== null) {
    //  delete old image file from aws
    await s3Service.deleteOne(postCoverImageS3Key.rows[0]);
  }
};

/**
 * @desc    Update  post
 * @route   Patch /api/v1/post
 * @access  Private
 */
module.exports.update = async (req, res) => {
  // add estimated reading time to data
  req.body.count_minutes_read = await readTime(req.body.md);
  // if update slug make slugify
  if (req.body.slug) req.body.slug = slugify(req.body.slug, "_");
  // update
  let updateCol = {};
  let updateDate = Object.values(req.body);

  Object.keys(req.body).forEach(function (key) {
    updateCol[key] = "";
  });

  let all_tags_for_post = await dbConnection.query(
    postSqlQuerys.GET_ALL_POST_TAG_BY_POST_ID,
    [req.params.id]
  );

  for (ob of all_tags_for_post.rows) {
    if (req.body.tags.includes(ob.tag) === false) {
      await dbConnection.query(postSqlQuerys.DELETE_POST_TAG, [ob._id]);
    }
  }

  for (tag of req.body.tags) {
    let if_exist = await dbConnection.query(
      postSqlQuerys.CHECK_IF_POST_TAG_EXIST,
      [req.params.id, tag]
    );

    if (if_exist.rows[0].exists != true) {
      await dbConnection.query(postSqlQuerys.CREATE_POST_TAG_REL, [
        req.params.id,
        tag,
      ]);
    }
  }
  const result = await dbConnection.query(
    postSqlQuerys.UPDATE_POST_DATA(req.params.id, "post", updateCol),
    updateDate
  );
  if (result.rowCount == 0)
    return res
      .status(400)
      .json({ message: "No valid entry found for provided ID" });

  res.status(200).json({ message: "Successful  update" });
};

/**
 * @desc    Get all  post
 * @route   GET /api/v1/post/
 * @access  Private
 */
module.exports.get_all = async (req, res) => {
  const redis = await rediConnection.getClient();

  // pagination element
  const pageNumber = parseInt(req.query.pageNumber, 10);
  const pageSize = parseInt(req.query.pageSize, 10);
  const publishState = req.query.state ? req.query.state : "published";
  if (publishState !== "published" && publishState !== "unpublished")
    return res
      .status(400)
      .json({ message: "No valid entry found for publish State" });

  let total, posts;

  if (req.query.search && req.query.search != "") {
    total = await dbConnection.query(
      postSqlQuerys.GET_POSTS_COUNT_WITH_SEARCH,
      [publishState === "published", "%" + req.query.search + "%"]
    );
    posts = await dbConnection.query(postSqlQuerys.GET_ALL_POSTS_WITH_SEARCH, [
      publishState === "published",
      "%" + req.query.search + "%",
      pageSize,
      (pageNumber - 1) * pageSize,
    ]);
  } else {
    total = await dbConnection.query(postSqlQuerys.GET_POSTS_COUNT, [
      publishState === "published",
    ]);
    posts = await dbConnection.query(postSqlQuerys.GET_ALL_POSTS, [
      publishState === "published",
      pageSize,
      (pageNumber - 1) * pageSize,
    ]);
  }
  total = total.rows[0].count;
  posts = posts.rows;

  if (req.query.search === undefined && req.query.state === undefined) {
    redis.hSet(
      req.redisHashTable,
      req.redisHashTablePath,
      JSON.stringify({
        total: parseInt(total, 10),
        posts,
      })
    );
  }
  res.status(200).json({
    total: parseInt(total, 10),
    posts,
  });
};

/**
 * @desc    Get one  post
 * @route   GET /api/v1/post/id/:id
 * @access  public
 */
module.exports.get_one_by_id = async (req, res) => {
  let post = await dbConnection.query(postSqlQuerys.GET_ONE_POST_BY_ID, [
    req.params.id,
  ]);
  post = post.rows[0];
  if (!post)
    return res
      .status(400)
      .json({ message: "No valid entry found for provided ID" });
  res.status(200).json({ post });
};

/**
 * @desc    Get one  post by slug
 * @route   GET /api/v1/post/:slug
 * @access  public
 */
module.exports.get_one_by_slug = async (req, res) => {
  let post = await dbConnection.query(postSqlQuerys.GET_ONE_POST_BY_SLUG, [
    req.params.slug,
  ]);
  post = post.rows[0];
  if (!post)
    return res
      .status(400)
      .json({ message: "No valid entry found for provided SLUG" });
  res.status(200).json({ post });
};
/**
 * @desc    Get posts by tag id
 * @route   GET /api/v1/post/tag/:tagId
 * @access  Private
 */
module.exports.get_all_by_tag_id = async (req, res) => {
  // pagination element
  const pageNumber = parseInt(req.query.pageNumber, 10);
  const pageSize = parseInt(req.query.pageSize, 10);

  let total = await dbConnection.query(
    postSqlQuerys.GET_POSTS_COUNT_BY_TAG_ID,
    [req.params.tagId]
  );
  total = total.rows[0].count;

  let posts = await dbConnection.query(postSqlQuerys.GET_ALL_POST_BY_TAG_ID, [
    req.params.tagId,
    pageSize,
    (pageNumber - 1) * pageSize,
  ]);

  posts = posts.rows;

  res.status(200).json({
    total: parseInt(total, 10),
    posts,
  });
};

/**
 * @desc    Delete  post
 * @route   Delete /api/v1/post/:id
 * @access  Private
 */
module.exports.delete = async (req, res) => {
  let result;
  try {
    await dbConnection.query("BEGIN");

    await dbConnection.query(postSqlQuerys.DELETE_POST_TAG_REL_BY_POST_ID, [
      req.params.id,
    ]);

    // remove post from love list for all user
    await dbConnection.query(postSqlQuerys.DELETE_POST_LOVE_FROM_ALL, [
      req.params.id,
    ]);
    // remove post from save list for all user
    await dbConnection.query(postSqlQuerys.UN_SAVE_POST_FROM_ALL_USER, [
      req.params.id,
    ]);

    result = await dbConnection.query(postSqlQuerys.DELETE_POST_BY_ID, [
      req.params.id,
    ]);

    await dbConnection.query("COMMIT");
  } catch (err) {
    console.log(err.message);
    await dbConnection.query("ROLLBACK");

    return res.status(400).json({ message: err.message });
  }
  if (result.rowCount == 0)
    return res
      .status(400)
      .json({ message: "No valid entry found for provided ID" });

  res.status(200).json({ message: "Post deleted." });
};

//                                love post

module.exports.love = async (req, res) => {
  let result = await dbConnection.query(
    postSqlQuerys.CHECK_POST_ALREADY_LOVED,
    [req.user._id, req.params.id]
  );

  if (result.rows[0].exists === true)
    return res.status(400).json({ message: "Post has already been loved." });

  await dbConnection.query(postSqlQuerys.INSERT_POST_LOVE, [
    req.user._id,
    req.params.id,
  ]);

  await dbConnection.query(postSqlQuerys.INCREMENT_LOVE_COUNT, [req.params.id]);

  res.status(200).json({ message: "Be loved" });
};

module.exports.unLove = async (req, res) => {
  let result = await dbConnection.query(postSqlQuerys.DELETE_POST_LOVE, [
    req.user._id,
    req.params.id,
  ]);

  if (result.rowCount == 0)
    return res
      .status(400)
      .json({ message: "No valid entry found for provided ID" });

  await dbConnection.query(postSqlQuerys.DESCREMENT_LOVE_COUNT, [
    req.params.id,
  ]);

  res.status(200).json({ message: "Be unloved" });
};

//                              SAVED POST

/**
 * @desc    Create new saved post
 * @route   Post /api/v1/post/save/
 * @access  Private [auth]
 */
module.exports.savePost = async (req, res) => {
  let isExist = await dbConnection.query(
    postSqlQuerys.CHECK_POST_ALREADY_SAVED,
    [req.user._id, req.params.id]
  );

  if (isExist.rows[0].exists === true)
    return res.status(400).json({ message: "Post has already been saved." });

  let result = await dbConnection.query(postSqlQuerys.SAVE_POST, [
    req.user._id,
    req.params.id,
  ]);

  if (result.rowCount == 0)
    return res
      .status(400)
      .json({ message: "Can not create this saved post for unknown reasons" });

  res.status(201).json({ message: "post saved." });
};

/**
 * @desc    Get all saved posts
 * @route   GET /api/v1/post/saved/
 * @access  Private [auth]
 */
module.exports.getAllSavedPosts = async (req, res) => {
  // pagination element
  const pageNumber = parseInt(req.query.pageNumber, 10);
  const pageSize = parseInt(req.query.pageSize, 10);

  let total = await dbConnection.query(postSqlQuerys.GET_SAVED_POSTS_COUNT,[req.user._id]);
  total = total.rows[0].count;

  let savedPosts = await dbConnection.query(postSqlQuerys.GET_ALL_SAVED_POSTS, [
    req.user._id,
    pageSize,
    (pageNumber - 1) * pageSize,
  ]);

  savedPosts = savedPosts.rows;

  res.status(200).json({
    total: parseInt(total, 10),
    savedPosts,
  });
};

/**
 * @desc    un  saved post
 * @route   POST /api/v1/post/saved/:id
 * @access  Private [auth]
 */
module.exports.unSavePost = async (req, res) => {

  const result = await dbConnection.query(postSqlQuerys.UN_SAVE_POST, [
    req.user._id,
    req.params.id,
  ]);

  if (result.rowCount == 0)
    return res.status(400).json({
      message: "No valid entry found for provided ID",
    });

  res.status(200).json({ message: "post be unsaved." });
};
