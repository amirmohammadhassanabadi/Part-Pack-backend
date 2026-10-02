/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: OTP authentication and token lifecycle
 *
 * @openapi
 * /auth/request-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Request an OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string, example: '09121234567' }
 *               otpWay: { type: string, nullable: true, example: sms }
 *     responses:
 *       200:
 *         description: OTP request accepted
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true } } }
 *       400: { description: Invalid phone number }
 *       429: { description: Too many OTP requests }
 *
 * /auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP and sign in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code]
 *             properties:
 *               phone: { type: string, example: '09121234567' }
 *               code: { type: string, example: '123456' }
 *     responses:
 *       200:
 *         description: OTP verification result
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   required: [registered]
 *                   properties: { registered: { type: boolean, example: false } }
 *                 - type: object
 *                   required: [registered, accessToken, refreshToken, user]
 *                   properties:
 *                     registered: { type: boolean, example: true }
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *                     user: { $ref: '#/components/schemas/AuthUser' }
 *       400: { description: Invalid or expired OTP }
 *
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh the access token
 *     description: Send refreshToken in JSON or in the x-refresh-token header.
 *     parameters:
 *       - in: header
 *         name: x-refresh-token
 *         required: false
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { refreshToken: { type: string } } }
 *     responses:
 *       200:
 *         description: Access token refreshed
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean }, accessToken: { type: string } } }
 *       401: { description: Refresh token missing or invalid }
 *
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke a refresh token
 *     parameters:
 *       - in: header
 *         name: x-refresh-token
 *         required: false
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { refreshToken: { type: string } } }
 *     responses:
 *       200: { description: Logged out successfully }
 *       401: { description: Refresh token missing or invalid }
 *
 * /auth/devlogin:
 *   post:
 *     tags: [Auth]
 *     summary: Development-only login
 *     description: Available only for local/development authentication flows.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code]
 *             properties: { phone: { type: string }, code: { type: string } }
 *     responses:
 *       200:
 *         description: Development access token
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { accessToken: { type: string }, user: { $ref: '#/components/schemas/AuthUser' } } }
 *       401: { description: Invalid development credentials }
 */
