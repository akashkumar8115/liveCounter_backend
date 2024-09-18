const express = require("express");
const mongoose = require("mongoose");
const app = express();
const dotenv = require('dotenv');
const cors = require("cors");
const PORT = process.env.PORT || 3001;
const URI = process.env.URI || "mongodb+srv://akash2884182:akash2884182@cluster0.my8k9ww.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Load environment variables from .env file
dotenv.config();

// Enable CORS
app.use(cors());

// Connect to MongoDB
mongoose.connect(URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("Error connecting to MongoDB:", error));

// Define a model for counts
const countSchema = new mongoose.Schema({
    namespace: String,
    key: String,
    value: Number,
    enableReset: Boolean,
    updateLowerbound: Number,
    updateUpperbound: Number
});
const Count = mongoose.model("Count", countSchema);

// Use built-in middleware to parse JSON and URL-encoded requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Hello World");
});

// Endpoint to create a new count
app.post("/api/create", async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).send("Request body is empty");
        }
        const { namespace, key, value = 0, enableReset = false, updateLowerbound = -1, updateUpperbound = 1 } = req.body;
        const newCount = new Count({ namespace, key, value, enableReset, updateLowerbound, updateUpperbound });
        await newCount.save();
        res.json(newCount);
    } catch (error) {
        console.error("Error creating count:", error);
        res.status(500).send("Error creating count");
    }
});

// Endpoint to get the current count
app.get("/api/get/:namespace/:key", async (req, res) => {
    try {
        const { namespace, key } = req.params;
        const count = await Count.findOne({ namespace, key });
        if (!count) {
            res.status(404).send("Count not found");
        } else {
            res.json(count);
        }
    } catch (error) {
        console.error("Error fetching count:", error);
        res.status(500).send("Error fetching count");
    }
});

// Endpoint to hit (increment) the count
app.put("/api/hit/:namespace/:key", async (req, res) => {
    try {
        const { namespace, key } = req.params;
        const count = await Count.findOneAndUpdate({ namespace, key }, { $inc: { value: 1 } }, { new: true });
        if (!count) {
            res.status(404).send("Count not found");
        } else {
            res.json(count);
        }
    } catch (error) {
        console.error("Error updating count:", error);
        res.status(500).send("Error updating count");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});