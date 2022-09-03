module.exports.getLogs = {
    summary: "get Logs",
    description: "you can use this end point to get logs.",
    operationId: "get Files",
    parameters: [
      {
        name: "pageNumber",
        in: "query",
        required: true,
        style: "form",
        schema: { type: "number" },
      },
      {
        name: "pageSize",
        in: "query",
        required: true,
        style: "form",
        schema: { type: "number" },
      },
    ],
    responses: { 200: { description: "", headers: {} } },
    tags: ["System"],
  };
  

  module.exports.getPostsSlugs = {
    summary: "get Posts slugs",
    description: "you can use this end point to get posts slugs.",
   
    responses: { 200: { description: "", headers: {} } },
    tags: ["System"],
  };