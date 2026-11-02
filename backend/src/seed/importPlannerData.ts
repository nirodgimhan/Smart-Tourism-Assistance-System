import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

import { env } from "../config/env.js";
import { Destination } from "../models/Destination.model.js";
import { Hotel } from "../models/Hotel.model.js";
import { TourPackage } from "../models/TourPackage.model.js";

// Optional:
// --destinations=path.json
// --hotels=path.json
// --packages=path.json

function fileFor(name: string) {
  const argument = process.argv
    .slice(2)
    .find(
      x => x.startsWith(`--${name}=`)
    );

  return path.resolve(
    argument
      ? argument.slice(name.length + 3)
      : `data/${name}.json`
  );
}

function load(
  name: string
): Record<string, unknown>[] {
  const data: unknown = JSON.parse(
    fs.readFileSync(
      fileFor(name),
      "utf-8"
    )
  );

  if (!Array.isArray(data)) {
    throw new Error(
      `${name} dataset must be a JSON array`
    );
  }

  return data as Record<string, unknown>[];
}

async function main() {
  await mongoose.connect(env.MONGODB_URI);

  try {
    let count = 0;

    for (const item of load("destinations")) {
      const coordinates =
        (
          item.location as {
            coordinates?: unknown
          } | undefined
        )?.coordinates;

      if (
        !item.name ||
        !item.district ||
        !item.category ||
        !Array.isArray(coordinates) ||
        coordinates.length !== 2
      ) {
        throw new Error(
          "Invalid destination dataset row"
        );
      }

      await Destination.updateOne(
        {
          name: item.name,
          district: item.district
        },
        { $set: item },
        {
          upsert: true,
          runValidators: true
        }
      );

      count++;
    }

    console.log(
      `Destinations imported: ${count}`
    );

    count = 0;

    for (const item of load("hotels")) {
      if (!item.name || !item.district) {
        throw new Error(
          "Invalid hotel dataset row"
        );
      }

      await Hotel.updateOne(
        {
          name: item.name,
          district: item.district
        },
        { $set: item },
        {
          upsert: true,
          runValidators: true
        }
      );

      count++;
    }

    console.log(
      `Hotels imported: ${count}`
    );

    count = 0;

    for (const item of load("packages")) {
      if (!item.name) {
        throw new Error(
          "Invalid package dataset row"
        );
      }

      await TourPackage.updateOne(
        { name: item.name },
        { $set: item },
        {
          upsert: true,
          runValidators: true
        }
      );

      count++;
    }

    console.log(
      `Packages imported: ${count}`
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});