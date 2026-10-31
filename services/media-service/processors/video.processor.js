// media-service/processors/video.processor.js

import {
  spawn,
} from "node:child_process";

import fs from "node:fs/promises";

/* =========================================================
   RUN FFMPEG
========================================================= */

function runFFmpeg(args) {
  return new Promise(
    (resolve, reject) => {
      const ffmpegProcess =
        spawn("ffmpeg", [
          "-hide_banner",
          "-loglevel",
          "error",
          "-y",
          ...args,
        ]);

      let stderr = "";

      ffmpegProcess.stderr.on(
        "data",
        (chunk) => {
          stderr +=
            chunk.toString();
        }
      );

      ffmpegProcess.on(
        "error",
        (error) => {
          reject(error);
        }
      );

      ffmpegProcess.on(
        "close",
        (code) => {
          if (code === 0) {
            resolve();
            return;
          }

          reject(
            new Error(
              `FFmpeg failed (${code}): ${stderr}`
            )
          );
        }
      );
    }
  );
}

/* =========================================================
   PROCESS VIDEO
========================================================= */

export async function processVideo({
  inputPath,
  outputPath,
  posterPath,
}) {
  if (!inputPath) {
    throw new Error(
      "inputPath is required"
    );
  }

  if (!outputPath) {
    throw new Error(
      "outputPath is required"
    );
  }

  if (!posterPath) {
    throw new Error(
      "posterPath is required"
    );
  }

  /* =======================================================
     720P VIDEO
  ======================================================= */

  await runFFmpeg([
    "-i",
    inputPath,

    "-map",
    "0:v:0",

    "-map",
    "0:a:0?",

    "-vf",
    "scale=-2:720:force_original_aspect_ratio=decrease",

    "-c:v",
    "libx264",

    "-preset",
    "medium",

    "-crf",
    "23",

    "-profile:v",
    "high",

    "-level",
    "4.1",

    "-pix_fmt",
    "yuv420p",

    "-c:a",
    "aac",

    "-b:a",
    "128k",

    "-ar",
    "48000",

    "-ac",
    "2",

    "-movflags",
    "faststart",

    outputPath,
  ]);

  /* =======================================================
     POSTER FRAME
  ======================================================= */

  await runFFmpeg([
    "-ss",
    "00:00:01",

    "-i",
    inputPath,

    "-frames:v",
    "1",

    "-vf",
    "scale=640:-2",

    "-q:v",
    "2",

    posterPath,
  ]);

  /* =======================================================
     READ OUTPUT
  ======================================================= */

  const [
    videoBuffer,
    posterBuffer,
  ] = await Promise.all([
    fs.readFile(outputPath),
    fs.readFile(posterPath),
  ]);

  /* =======================================================
     RETURN
  ======================================================= */

  return {
    video: {
      body:
        videoBuffer,

      size:
        videoBuffer.length,

      mimeType:
        "video/mp4",
    },

    poster: {
      body:
        posterBuffer,

      size:
        posterBuffer.length,

      mimeType:
        "image/jpeg",
    },
  };
}