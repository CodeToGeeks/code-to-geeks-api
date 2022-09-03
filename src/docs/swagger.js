const auth = require("./auth");
const account = require("./account");
const homePage = require("./homePage");
const post = require("./post");
const tag = require("./tag");
const message = require("./message");
const about = require("./aboutAs");
const file = require("./file");
const system = require("./system")
module.exports = {
  openapi: "3.0.0",
  servers: [
    {
      url:  "http://13.37.123.41/api/v1/",
      description: "AWS",
      variables: {},
    },
    {
      url: "http://localhost:4000/api/v1/",
      description: "Devlopment server (uses test data)",
      variables: {},
    },
   
  ],
  info: {
    version: "v1",
    title: "CODE-TO-GEEKS API",
    description:
      "This api was developed  by codetogeeks TECH Company, @copyright CODETOGEEKS 2022",
    termsOfService: "",
    contact: {},
    license: { name: "" },
  },

  tags: [
    {
      name: "Auth",
      description: "Everything about authentication and authorization.",
    },
    {
      name: "Account",
      description: "Everything about user accounts.",
    },

    {
      name: "Post",
      description: "Everything about posts.",
    },
    {
      name: "Tag",
      description: "Everything about tags.",
    },
   
    {
      name: "File",
      description: "Everything about files.",
    },
    {
      name: "System",
      description: "Everything about system.",
    }
    /*
       {
      name: "HomePage",
      description: "Everything about home page",
    },
    
    {
      name: "AboutUs",
    },
    {
      name: "Message",
    },*/
  ],

  paths: {
    "/auth/signin": {
      post: auth.signIn,
    },
    "/auth/signup": {
      post: auth.signup,
    },
    "/auth/resend/verification/email": {
      post: auth.resendConfirmationEmail,
    },
    "/auth/account/recover": {
      post: auth.recover,
    },
    "/auth/code/check": {
      post: auth.AuthCodeCheck,
    },
    "/auth/password/reset": {
      post: auth.AuthPasswordReset,
    },

    "/auth/verification/{token}" :{
      post: auth.emailVerification
    },
    "/auth/password": {
      patch: auth.AuthPasswordUpdate,
    },

    "/auth/google" :{
      post : auth.googleSignIn  
    },
    "/auth/facebook" :{
      post : auth.facebookSignIn  
    },
    "/auth/linkedin" :{
      post : auth.linkedinSignIn  
    },
    "/auth/token/valid":{
      post: auth.validateToken
    },
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    "/account": {
      get: account.getAccountData,
      patch: account.updateAccountData,
      
    },
    "/account/profile/image" :{
      get :account.getProfileImage,
      post : account.uploadAccountProfileImage
     
    },

    "/account/profile/social":{
      get : account.getAllSocialLink,
      post: account.createSocialLink
    },
    "/account/author/profile/{author_id}":{
      get : account.getAuthorProfiletData
 
    },
    
    "/account/interactions":{
      get: account.getInteractions
    },

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    /*"/home": {
      get: homePage.getHomePage,
    },
    "/home/banner/": {
      get: homePage.getBanners,
      post: homePage.addBanner,
    },
    "/home/banner/{bannerId}": {
      delete: homePage.deleteBanner,
    },*/
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    "/post/": {
      get: post.getPosts,
      post: post.create
    },
    "/post/cover/image/{post_id}" :{
      post : post.uploadPostCoverImage,
 
    },
    "/post/cover/image/reset/{post_id}" :{
      post : post.resetPostCoverImage,
 
    },
    "/post/id/{post_id}": {
      get: post.getOnePostByPostId,
    },
    "/post/{slug}": {
      get: post.getOnePostBySlug,
    },
    "/post/tag/{tag_id}": {
      get: post.getOnePostByTagId,
    },
    "/post/{post_id}": {
      patch:  post.update,
      delete: post.deletePost,
    },
    "/post/love/{post_id}": {
      post:  post.lovePost,
    },
    "/post/unlove/{post_id}": {
      post:  post.unlovePost,
    },
    "/post/save" : {
      get  : post.getSavedPosts,     
    },
    "/post/save/{post_id}" :{
      post : post.savePost
    },
    "/post/unsave/{post_id}": {
      post : post.unSavedPost
    },

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    "/tag": {
      get: tag.getTags,
      post: tag.create,
    },
    "/tag/{tag_id}": {
      get: tag.getOneTagByTagId,
      patch: tag.update,
      delete: tag.deleteTag,
    },


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    "/file" : {
      get : file.getFiles,
      post : file.upload
     
    },
    "/file/{file_id}" :{
      get : file.getFile,
      patch : file.update,
      delete : file.deleteFile
    },
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    "/sys/log" :{
      get : system.getLogs
      
    },
    "/sys/post/slugs" :{
      get : system.getPostsSlugs
    },
    
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /*  "/messages/": {
      get: message.getAllMessages,
      post: message.createMessage,
    },
    "/messages/{messageId}": {
      get: message.getOneMessage,
      delete: message.deleteMessage,
    },
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    "/about/": {
      get: about.getAboutUs,
    },
    "/about/paragraphs": {
      patch: about.updateAboutUsParagraphs,
    },
    "/about/files": {
      get: about.getAboutUsFiles,
      post: about.uploadAboutUsFiles,
    },
    "/about/banner/": {
      get: about.getBanners,
      post: about.addBanner,
    },
    "/about/banner/{bannerId}": {
      delete: about.deleteBanner,
    },
    "/about/video": {
      post: about.uploadVideo,
    },*/
  },

  components: {
    parameters: {
      "x-auth-token": {
        name: "x-auth-token",
        in: "header",
        required: true,
        style: "simple",
        schema: {
          type: "string",
        },
      },
    },
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        name: "x-auth-token",
        scheme: "bearer",
        description: "Enter JWT token",
        in: "header",
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],

  externalDocs: { url: "", description: "" },
  warnings: [],
};
