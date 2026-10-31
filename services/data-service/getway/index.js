import http from "http";

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        service: "nginx-gateway",
        status: "ok",
      })
    );

    return;
  }

  res.writeHead(404, {
    "Content-Type": "application/json",
  });

  res.end(
    JSON.stringify({
      error: "Not Found",
    })
  );
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Gateway health server running on port ${PORT}`);
});