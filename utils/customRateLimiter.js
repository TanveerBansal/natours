const express = require("express")
const app = express()

//Store req data for each IP
const requests = {}

// Rate limit configuration
const RATE_LIMIT = 2;
const WINDOW_MS = 1 * 60 * 1000;

// Middleware
module.exports.customRateLimiter = (req, res, next) => {
    const ip = req.ip; // Get the user's IP address
    const currentTime = Date.now();

    // If the IP is not in the requests object, initialize it
    if (!requests[ip]) {
        requests[ip] = {
            count: 1,
            firstRequestTime: currentTime, // Store the timestamp of the first request
        };
    } else {
        // If the user is already in the object, check the time window
        const timeElapsed = currentTime - requests[ip].firstRequestTime;

        // If within the time window
        if (timeElapsed < WINDOW_MS) {
            if (requests[ip].count >= RATE_LIMIT) {
                // If the limit is exceeded, return a 429 status and reset time based on first request
                res.setHeader('RateLimit-Limit', RATE_LIMIT);
                res.setHeader('RateLimit-Remaining', 0);
                res.setHeader('RateLimit-Reset', Math.ceil(requests[ip].firstRequestTime / 1000) + (WINDOW_MS / 1000));
                return res.status(429).json({ message: 'Too many requests, please try again later.' });
            } else {
                // Otherwise, increment the count
                requests[ip].count++;
            }
        } else {
            // If the time window has passed, reset the count and update the first request time
            requests[ip] = {
                count: 1,
                firstRequestTime: currentTime,
            };
        }
    }

    // Set headers for remaining requests and rate limit information
    res.setHeader('RateLimit-Limit', RATE_LIMIT); // Max requests per window
    res.setHeader('RateLimit-Remaining', RATE_LIMIT - requests[ip].count); // Remaining requests
    res.setHeader('RateLimit-Reset', Math.ceil(requests[ip].firstRequestTime / 1000) + (WINDOW_MS / 1000)); // Reset time based on first request

    // Continue with the request
    next();
};