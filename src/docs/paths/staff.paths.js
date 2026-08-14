/**
 * @openapi
 *
 * /staff:
 *   get:
 *     summary: Get all staff
 *     description: Returns a list of staff members. Admins and operators can access this endpoint.
 *     tags:
 *       - Staff
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: Filter staff by phone number.
 *         example: 09121234567
 *
 *       - in: query
 *         name: fullName
 *         schema:
 *           type: string
 *         description: Filter staff by full name. Case-insensitive partial matching is supported.
 *         example: Ali
 *
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum:
 *             - admin
 *             - operator
 *         description: Filter staff by role.
 *         example: operator
 *
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter staff by active status.
 *         example: true
 *
 *     responses:
 *       200:
 *         description: List of staff members.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Staff'
 *
 *       401:
 *         description: Authentication required or token is invalid.
 *
 *       403:
 *         description: Access denied. Only admin and operator can access this endpoint.
 *
 *
 * /staff/{id}:
 *   get:
 *     summary: Get staff by ID
 *     description: Returns a single staff member by MongoDB ObjectId.
 *     tags:
 *       - Staff
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the staff member.
 *         example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *     responses:
 *       200:
 *         description: Staff member found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Staff'
 *
 *       400:
 *         description: Invalid staff ID.
 *
 *       401:
 *         description: Authentication required or token is invalid.
 *
 *       403:
 *         description: Access denied. Only admin and operator can access this endpoint.
 *
 *       404:
 *         description: Staff member not found.
 *
 *
 *   put:
 *     summary: Update staff
 *     description: Updates one or more fields of a staff member. Admins and operators can access this endpoint.
 *     tags:
 *       - Staff
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the staff member.
 *         example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStaffRequest'
 *
 *     responses:
 *       200:
 *         description: Staff member updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Staff'
 *
 *       400:
 *         description: Invalid staff ID or invalid request body.
 *
 *       401:
 *         description: Authentication required or token is invalid.
 *
 *       403:
 *         description: Access denied. Only admin and operator can access this endpoint.
 *
 *       404:
 *         description: Staff member not found.
 *
 *
 * /staff/{id}/status:
 *   patch:
 *     summary: Update staff active status
 *     description: Activates or deactivates a staff member. The corresponding Auth record is updated as well.
 *     tags:
 *       - Staff
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the staff member.
 *         example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStaffStatusRequest'
 *
 *     responses:
 *       200:
 *         description: Staff status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Staff'
 *
 *       400:
 *         description: Invalid staff ID or isActive value.
 *
 *       401:
 *         description: Authentication required or token is invalid.
 *
 *       403:
 *         description: Access denied. Only admin and operator can access this endpoint.
 *
 *       404:
 *         description: Staff member not found.
 */