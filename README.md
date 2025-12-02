# Online Auction Backend API

Backend API cho hệ thống đấu giá trực tuyến, xây dựng với NestJS framework.

## 🚀 Cài đặt

### 1. Clone repository và cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình Environment Variables

Tạo file `.env` từ template:

```bash
cp .env.example .env
```

Cập nhật các giá trị trong `.env`:

```env
# Required
PORT=3000
MONGODB_URI=mongodb://localhost:27017/online-auction
JWT_SECRET=your_strong_secret_key
JWT_REFRESH_SECRET=your_refresh_token_secret
RECAPTCHA_SECRET_KEY=your_recaptcha_secret

# Optional (for Google OAuth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional (for email - will log to console if not set)
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### 3. Khởi động MongoDB

```bash
# Sử dụng Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Hoặc cài đặt MongoDB local
# https://www.mongodb.com/docs/manual/installation/
```

### 4. Chạy ứng dụng

```bash
# Development mode với hot-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

Ứng dụng sẽ chạy tại:
- API: `http://localhost:3000`
- Swagger Docs: `http://localhost:3000/api`

## 📚 API Documentation

### Swagger UI
Truy cập Swagger documentation tại: `http://localhost:3000/api`

Swagger cung cấp:
- Interactive API testing
- Request/Response schemas
- Authentication flow với JWT Bearer token
- Đầy đủ mô tả cho tất cả endpoints

## 🧪 Testing API

### Sử dụng Swagger UI (Recommended)
1. Truy cập `http://localhost:3000/api`
2. Test các endpoint trực tiếp trên UI
3. Authenticate bằng cách click "Authorize" và nhập Bearer token

### Sử dụng cURL

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyen Van A",
    "email": "user@example.com",
    "password": "Password123!",
    "address": "123 ABC Street",
    "recaptchaToken": "token_here"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "recaptchaToken": "token_here"
  }'
```

## 📝 Notes

- reCAPTCHA token có thể skip trong development (cần cấu hình)


## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
