const fileData = "data:image/jpeg;name=test.jpg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD";
const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
console.log(matches);
