const { log } = require("winston");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const logger = require("./../utils/logger");
const axios = require("axios");
const dotenv = require("dotenv");

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "test"
    ? ".env.test"
    : ".env.development";
dotenv.config({ path: envFile });

const getPayPalAccessToken = async () => {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  };

  exports.createPaypalOrder = catchAsync(async (req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("createPaypalOrder function called");
    }

    try {
        const { amount } = req.body;

        if (!amount) {
          return next(new AppError("Please provide a valid amount", 400));
        }

        const payPalAccessToken = await getPayPalAccessToken();
    
        const response = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders`,
            {
              intent: "CAPTURE",
              purchase_units: [
                {
                  amount: {
                    currency_code: "USD",
                    value: amount,
                  },
                },
              ],
            },
            {
              headers: {
                Authorization: `Bearer ${payPalAccessToken}`,
                "Content-Type": "application/json",
              },
            }
        );

        res.json({ orderID: response.data.id }); // Ensure response is correct
    } catch (err) {
        logger.error(err);
        return next(new AppError("Error creating PayPal order", 500));
    }
});

exports.capturePaypalOrder = catchAsync(async (req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("capturePaypalOrder function called");
    }

    try {
        const { orderID } = req.body; // Ensure you're getting the orderID from the request

        console.log(orderID)

        if (!orderID) {
            return next(new AppError("Please provide a valid orderID", 400));
        }

        const accessToken = await getPayPalAccessToken();
    
        const response = await axios.post(
          `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
    
        res.json({ transactionDetails: response.data });
    } catch (error) {
        logger.error(error);
        return next(new AppError('Error capturing PayPal order!', 500));
    }
});

exports.createSubscription = catchAsync(async (req, res, next) => {
    if (process.env.NODE_ENV!== "production") {
      console.log("createSubscription function called");
    }

    try {
        const { planId, userId, username, entity, role } = req.body;
        if (!planId) {
            return next(new AppError("Plan ID is required", 400));
        }

        if (process.env.NODE_ENV !== "production") {
          console.log("JHKDSHJKFGSJKLDFJKLDSFJKLDSJKLFDSJKLFJKLDSFJKL", planId, userId, username, entity, role)
        }

        // Validate the token and get user info
        const user = req.user; // Assuming you have middleware that validates the token and attaches user info to req
        if (!user || user.id !== userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const accessToken = await getPayPalAccessToken();
        const response = await axios.post(
            `${PAYPAL_API}/v1/billing/subscriptions`,
            {
                plan_id: planId,
                start_time: new Date(new Date().getTime() + 1000 * 60 * 5).toISOString(),
                subscriber: {
                    email_address: user.email, // Assuming you have this in your user object
                },
                application_context: {
                    brand_name: "WHERE2",
                    locale: "en-US",
                    shipping_preference: "NO_SHIPPING",
                    user_action: "SUBSCRIBE_NOW",
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        // You might want to save the subscription details to your database here
        // along with the userId, entity, and role

        res.json({ subscriptionID: response.data.id });
    } catch (error) {
        logger.error(error);
        return next(new AppError("Error creating PayPal subscription", 500));
    }
});
