import fs from "node:fs/promises";
import sharp from "sharp";
import path from "path";
import xdg from "@folder/xdg";
import crypto from "crypto";
import { fileURLToPath } from "url";

async function initImages(basePath) {
  const dirs = await fs.readdir(basePath);

  const images = await Promise.all(
    dirs.map(async (dir) => {
      const dirPath = path.join(basePath, dir);
      const images = await fs.readdir(dirPath);
      return images.map((img) => path.join(dirPath, img));
    })
  );

  return images.flat();
}

async function cacheImages(images, cachePath, sizes) {
  await clearCache(cachePath);
  await fs.mkdir(cachePath, { recursive: true });

  await Promise.all(
    images.map(async (img) => {
      await Promise.all(
        sizes.map(async (size) => {
          const downscaledImage = await downscaleImage(img, size);
          const hash = crypto.createHash("sha256");
          hash.update(downscaledImage);
          const imgName = hash.digest("hex");
          const outputFilePath = path.join(cachePath, `${size}-${imgName}.jpg`);
          await fs.writeFile(outputFilePath, downscaledImage);
        })
      );
    })
  );
}

async function clearCache(cachePath) {
  await fs.rm(cachePath, { recursive: true, force: true });
}

async function runAllComparisons(cachePath) {
  const images = await fs.readdir(cachePath);
  return await Promise.all(
    images.map(async (img) => await compare(img, images))
  );
}

async function compare(img, images) {
  const index = images.indexOf(img);
  if (index !== -1) {
    images = images.toSpliced(index, 1);
  }

  return await Promise.all(
    images.map(async (otherImage) => {
      const size = parseInt(otherImage.split("-")[0], 10);
      const score = await recognizeFace(img, otherImage);
      return { size: size, score: score };
    })
  );
}

/**
 * Compares two faces and returns a promise that resolves with a random value.
 *
 * @param {Object} face1 - The first face to compare.
 * @param {Object} face2 - The second face to compare.
 * @returns {Promise<number>} A promise that resolves with a random number.
 */
async function recognizeFace(face1, face2) {
  return await new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random());
    }, 100);
  });
}

/**
 * Downscales an image to the specified width.
 *
 * @param {Buffer|string} image - The image to downscale. Can be a Buffer or a file path.
 * @param {number} size - The desired width to downscale the image to.
 * @returns {Promise<Buffer>} A promise that resolves to the downscaled image as a Buffer.
 * @throws Will throw an error if the image cannot be downscaled.
 */
async function downscaleImage(image, size) {
  return await sharp(image).resize({ width: size }).toBuffer();
}

async function createChart(results) {
  // TODO: finish this API call to create a graph
  // example: https://quickchart.io/chart?c={type:'bar',data:{labels:[2012,2013,2014,2015, 2016],datasets:[{label:'Users',data:[120,60,50,180,120]}]}}

  const oderedResults = new Map();
  results.forEach((res) => {
    oderedResults.set(res.size, [...res.score]);
  });

  console.log(oderedResults);

  const config = {
    type: "bar",
    data: {
      labels: [2012, 2013, 2014, 2015, 2016],
      datasets: [
        {
          label: "Users",
          data: [120, 60, 50, 180, 120],
        },
      ],
    },
  };
}

const testdataPath = path.resolve(process.cwd(), process.argv[2]);
const sizes = JSON.parse(process.argv[3]);
const dirs = xdg();
const cachePath = path.resolve(dirs.cache, "downscaled-images-for-comparison");

try {
  const images = await initImages(testdataPath);
  await cacheImages(images, cachePath, sizes);
  const results = await runAllComparisons(cachePath);
  // createChart(results);

  console.log(results.flat());
} finally {
  await clearCache(cachePath);
}
