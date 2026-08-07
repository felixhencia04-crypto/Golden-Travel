import express from 'express';
const app = express();
app.get("/api/payments/:id/proof*", (req, res) => {
  res.send(`ID: ${req.params.id}`);
});
const server = app.listen(3001, () => {
  console.log("Started");
});
