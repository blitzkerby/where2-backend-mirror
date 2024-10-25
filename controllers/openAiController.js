const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const { OpenAI } = require("openai");
const dotenv = require("dotenv");

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "test"
    ? ".env.test"
    : ".env.development";
dotenv.config({ path: envFile });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_SECRET,
});

exports.summarize = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("authController says: summarize function hits.");
  }

  const { text } = req.body;

  console.log("Text received:", text);

  if (!text) {
    return next(new AppError("Text to summarize is required", 400));
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Updated model
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that summarizes text concisely.",
        },
        {
          role: "user",
          content: `Please summarize the following text:\n\n${text}`,
        },
      ],
      max_tokens: 350,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    console.log("API Response:", response);

    if (response.choices && response.choices[0].message) {
      res.json({
        success: true,
        summary: response.choices[0].message.content.trim(),
      });
    } else {
      console.error("Unexpected response structure:", response);
      return next(new AppError("No summary generated", 500));
    }
  } catch (e) {
    console.error("Error generating summary:", e.response?.data || e.message);
    return next(new AppError("Could not generate summary", 500));
  }
});
