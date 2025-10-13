# Apartment Rental Service Website

## Overview
This project is a web-based platform for apartment rental services, connecting tenants with property owners. Built with a Service-Oriented Architecture (SOA), the system ensures flexibility, scalability, and security using modern technologies like **Next.js**, **Node.js**, **React**, **Shadcn**, and **AWS services** (EC2, Cognito, RDS, S3).

## Features
* **User Management**: Register, login, and manage user profiles with role-based access (tenants, owners, admins) using AWS Cognito.
* **Apartment Management**: Owners can add, edit, or delete apartment listings, with media stored in AWS S3.
* **Search & Recommendation**: Filter apartments by price, location, and amenities; personalized suggestions based on user history.
* **Booking & Scheduling**: Real-time availability checks and booking confirmations via email/SMS.
* **Payment**: Secure transactions and refunds via Stripe integration.
* **Reporting & Analytics**: Revenue and usage reports for owners and admins.

## Technologies
* **Frontend**: Next.js, React, Shadcn (for responsive UI components)
* **Backend**: Node.js with Express (RESTful APIs)
* **Cloud Services**:
  * AWS EC2: Hosting microservices
  * AWS Cognito: Authentication and authorization
  * AWS RDS (PostgreSQL): Structured data storage
  * AWS S3: Media storage
* **Architecture**: Service-Oriented Architecture (SOA) with microservices
* **Other**: Docker for containerization, AWS API Gateway, SQS/SNS for service communication

## Setup Instructions
1. **Prerequisites**:
   * Node.js (v18 or higher)
   * AWS CLI and configured AWS account
   * Docker (optional for containerization)
2. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd real_estate
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Run Locally**:
   ```bash
   npm run dev
   ```
   Access the app at http://localhost:3000.
5. **Deploy to AWS**:
   * Build Docker images for microservices.
   * Deploy to AWS ECS or EC2 using AWS CLI or Management Console.
   * Configure AWS API Gateway and CloudFront for frontend.







