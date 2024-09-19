const express = require("express");
const mongoose = require("mongoose");
const app = express();
const dotenv = require('dotenv');
const cors = require("cors");
const PORT = process.env.PORT || 5000;
const URI = process.env.URI || "mongodb+srv://akash2884182:akash2884182@cluster0.my8k9ww.mongodb.net/?retryWrites=true&w=majority";

// Load environment variables from .env file
dotenv.config();

// Enable CORS
const corsOptions = {
    origin: 'https://portfolio3d-henna.vercel.app',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    exposedHeaders: 'Content-Range,X-Content-Range', // Expose these headers
    maxAge: 3600, // Preflight response is valid for 1 hour
    credentials: true, // Allow credentials  
};
app.use(cors(corsOptions));

// Connect to MongoDB
mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000 // Adjust timeout as needed
})
    .then(() => {
        console.log("Connected to MongoDB");
        // Start the server after the connection is established
        startServer();
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
    });

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

class CustomError extends Error {
    constructor(message, statusCode, isOperational) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
    }
}

app.use((error, req, res, next) => {
    if (!error.isOperational) {
        console.error("Non-operational error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }

    return res.status(error.statusCode).json({ message: error.message });
});

function startServer() {
    app.get("/", (req, res) => {
        res.send("Hello World");
    });

    // Endpoint to create a new count
    app.post("/api/create", async (req, res) => {
        try {
            if (!req.body) {
                throw new CustomError("Request body is empty", 400, true);
            }
            const { namespace, key, value = 0, enableReset = false, updateLowerbound = -1, updateUpperbound = 1 } = req.body;
            const newCount = new Count({ namespace, key, value, enableReset, updateLowerbound, updateUpperbound });
            await newCount.save();
            res.json(newCount);
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                throw new CustomError(error.message, 400, true);
            }
            throw error;
        }
    });

    // Endpoint to get the current count
    app.get("/api/get/:namespace/:key", async (req, res) => {
        try {
            const namespace = req.params.namespace;
            const key = req.params.key;
            const count = await Count.findOne({ namespace, key });
            if (!count) {
                throw new CustomError("Count not found", 404, true);
            } else {
                res.json(count);
            }
        } catch (error) {
            throw error;
        }
    });

    // Endpoint to hit (increment) the count
    app.put("/api/hit/:namespace/:key", async (req, res) => {
        try {
            const namespace = req.params.namespace;
            const key = req.params.key;
            const count = await Count.findOneAndUpdate({ namespace, key }, { $inc: { value: 1 } }, { new: true });
            if (!count) {
                throw new CustomError("Count not found", 404, true);
            } else {
                res.json(count);
            }
        } catch (error) {
            throw error;
        }
    });


    app.get("/api", async (req, res) => {
        // res.json({message:"Welcome to the API!"})
        const namespace = "akash";
        const key = "kumar";
        const count = await Count.findOneAndUpdate({ namespace, key }, { $inc: { value: 1 } }, { new: true });
        console.log(count);
        res.send(count)
    })

    app.listen(PORT, async () => {
        console.log(`Server running on port ${PORT}`);
        // const namespace = "akash";
        // const key = "kumar";
        // const count = await Count.findOneAndUpdate({ namespace, key }, { $inc: { value: 1 } }, { new: true });
        // console.log(count);

    });
}