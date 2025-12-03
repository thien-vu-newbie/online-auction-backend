# Online Auction Backend API

Backend API cho hệ thống đấu giá trực tuyến, xây dựng với NestJS framework.

## 🚀 Quick Start

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Cấu hình Environment Variables

Tạo file `.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/online-auction

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here

# reCAPTCHA (Google)
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Email (Optional - sẽ log OTP ra console nếu không config)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@auction.com

# ELK Stack - Logging & Monitoring
ELASTICSEARCH_URL=http://localhost:9200
```

### 3. Khởi động MongoDB

```bash
# Sử dụng Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Hoặc cài đặt MongoDB local: https://www.mongodb.com/docs/manual/installation/
```

### 4. Khởi động ELK Stack (Logging & Monitoring)

```bash
# Start Elasticsearch, Kibana, Logstash
docker-compose up -d

# Verify services
docker-compose ps
```

Services sẽ chạy tại:
- **Elasticsearch**: http://localhost:9200
- **Kibana**: http://localhost:5601

### 5. Chạy Application

```bash
# Development với hot-reload
npm run start:dev

# Production
npm run build
npm run start:prod
```

Application chạy tại:
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api

## 📊 Logging & Monitoring

### Setup Kibana để xem Logs

1. **Truy cập Kibana**: http://localhost:5601 (đợi ~30s lần đầu)

2. **Tạo Data View**:
   - Menu ☰ → **Management** → **Stack Management**
   - Click **Data Views** → **Create data view**
   - Name: `NestJS Logs`
   - Index pattern: `nestjs-logs*`
   - Timestamp field: `@timestamp`
   - Click **Create data view**

3. **View Logs**:
   - Menu ☰ → **Analytics** → **Discover**
   - Select **NestJS Logs**
   - Set time range: **Last 15 minutes**

### Log Structure

```json
{
  "@timestamp": "2025-12-03T02:19:36.178Z",
  "level": "info",
  "message": "Incoming Request",
  "meta": {
    "context": "HTTPRequest",
    "method": "POST",
    "url": "/auth/register",
    "statusCode": 201,
    "responseTime": "2551ms",
    "ip": "::1",
    "userAgent": "PostmanRuntime/7.49.1"
  }
}
```

### Auto Delete Policy

Logs tự động xóa sau **30 ngày** (ILM policy đã config).

## 📚 API Documentation

### Swagger UI

Truy cập: http://localhost:3000/api

Features:
- Interactive API testing
- Request/Response schemas  
- JWT Authentication flow
- Mô tả đầy đủ cho tất cả endpoints

## 🔐 Security Features

- ✅ JWT Access Token (30m) + Refresh Token (7d)
- ✅ Password hashing với bcrypt (10 rounds)
- ✅ Email OTP verification
- ✅ reCAPTCHA v2 protection
- ✅ Google OAuth integration
- ✅ Refresh token rotation
- ✅ Input validation trên mọi endpoint

## 🚨 Troubleshooting

### App không start

```bash
# Check MongoDB
docker ps | grep mongodb

# Check ports
netstat -ano | findstr :3000
netstat -ano | findstr :27017

# Clear node_modules
rm -rf node_modules package-lock.json
npm install
```

### Logs không hiển thị trong Kibana

```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health

# Check indices
curl http://localhost:9200/_cat/indices?v

# Restart ELK stack
docker-compose restart
```

### Email không gửi

- Kiểm tra `MAIL_USER` và `MAIL_PASSWORD` trong `.env`
- Nếu dùng Gmail: bật 2FA và tạo App Password
- Development: OTP sẽ log ra console nếu email chưa config

## 📝 Notes

- Test reCAPTCHA key: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe` (Google test key)
- MongoDB local: `mongodb://localhost:27017/online-auction`
- JWT access token expires: 30 minutes
- JWT refresh token expires: 7 days
- Logs auto-delete: 30 days (ILM policy)

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
