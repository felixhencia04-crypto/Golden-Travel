const obj = {
  query: {
    users: {
      findFirst: async () => { throw new Error("test"); }
    }
  }
};
console.log(obj.query.users.findFirst);
