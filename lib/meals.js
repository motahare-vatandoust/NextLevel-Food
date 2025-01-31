import sql from "better-sqlite3";
import slugify from "slugify";
import xss from "xss";
import fs from "node:fs";

const db = sql("meals.db");

export async function getMeals() {
  await new Promise((resolve) => setTimeout(resolve, 2000)); // remove this later
  //   throw new Error("Loading meals failed"); // to test error handling
  return db.prepare("SELECT * FROM meals").all();
}

export function getMeal(slug) {
  return db.prepare("SELECT * FROM meals WHERE slug = ?").get(slug);
}

export async function saveMeal(meal) {
  meal.slug = slugify(meal.title, { lower: true });
  meal.instructions = xss(meal.instructions);

  const imageFile = meal.image;
  if (!imageFile || !imageFile.name) {
    throw new Error("Image file is missing");
  }

  const extension = imageFile.name.split(".").pop();
  const fileName = `${meal.slug}.${extension}`;
  const filePath = `public/images/${fileName}`;

  try {
    const bufferedImage = Buffer.from(await imageFile.arrayBuffer());

    fs.writeFileSync(filePath, bufferedImage); // Synchronously write file
    meal.image = `/images/${fileName}`;

    db.prepare(
      `
      INSERT INTO meals (title, summary, instructions, image, creator, creator_email, slug) VALUES 
      (@title, @summary, @instructions, @image, @creator, @creator_email, @slug)`
    ).run(meal);
  } catch (error) {
    console.error("Error saving meal:", error);
    throw new Error("Failed to save meal");
  }
}
