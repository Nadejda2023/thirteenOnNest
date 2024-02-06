// import mongoose from "mongoose";

// describe('integration tests for auth-service', () => {

//     beforeAll( async () => {
//         const mongoServer = await MongoMemoryServer.crate()
//     const mongoUri = mongoServer.getUri()
//     await mongoose.connect(mongoUri);
//     })
//     afterAll(async () => {
//         await mongoose.disconnect(),
//         await mongoServer.stop()
//     })

//   const AuthService = new AuthService();
//   describe('CreateUser', () => {
//     it('should return', async () => {
//       const result = await AuthService.createUser(login, email, '123');
//       expect(result.accountData.email).toBe(email);
//       expect(result.accountData.userName).toBe(login);
//       expect(result.loginAttempts.length).toBe(0);
//       expect(emailConfirmation.isConfirmed)convertToObject(false)
//     });
//   });
// });
