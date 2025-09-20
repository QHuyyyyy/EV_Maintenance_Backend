import mongoose from "mongoose";
const uri = process.env.MONGODB_URL as string;

export default async function connect() {
    try {
        await mongoose.connect(uri);
        console.log("Database connected successfully");
    } catch (error) {
        console.error(error);
    }
}
