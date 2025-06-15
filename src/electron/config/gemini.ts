import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyA7XshzAS9NwuP6xH04K3iamNBdXEzxErM");

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export default model;