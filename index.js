import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from 'dotenv';

const app = express();
app.use(express.json());
dotenv.config();

const apiKey = process.env.API_KEY;


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


function imageFileToBase64(imagePath) {
    const imageData = fs.readFileSync(path.resolve(__dirname, imagePath));
    return Buffer.from(imageData).toString("base64");
}


async function imageUrlToBase64(imageUrl) {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary").toString("base64");
}


app.post("/try-on", async (req, res) => {
    try {
        const { cloth_image, pose_image } = req.body; 

        const modelImageBase64 = pose_image.startsWith("http")
            ? await imageUrlToBase64(pose_image)
            : imageFileToBase64(pose_image);

        const clothImageBase64 = cloth_image.startsWith("http")
            ? await imageUrlToBase64(cloth_image)
            : imageFileToBase64(cloth_image);

        const data = {
            model_image: modelImageBase64,
            cloth_image: clothImageBase64,
            category: "Upper body",
            num_inference_steps: 20,
            guidance_scale: 2,
            seed: 12467,
            base64: false,
        };

        const response = await axios.post("https://api.segmind.com/v1/try-on-diffusion", data, {
            headers: {
                "x-api-key": apiKey,
            },
        });

        res.json(response.data);
        console.log(response.data);
    } catch (error) {
        console.error("Erro:", error.response?.data || error.message);
        res.status(500).json({ error: "Erro ao gerar imagem com try-on." });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});