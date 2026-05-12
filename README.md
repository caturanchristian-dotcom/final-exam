# Student Information Management System
IT318-Web Development Final Practical Examination

## Deployment Information
- **Render Deployment Link:** [INSERT_YOUR_RENDER_URL_HERE]
- **GitHub Repository:** [INSERT_YOUR_GITHUB_REPO_URL_HERE]
- **Database:** Aiven MySQL Cloud Host

## Project Setup

### 1. Prerequisites
- Node.js (v18+)
- MySQL Database (Aiven)

### 2. Database Configuration
Run the following SQL script on your Aiven MySQL instance to create the required table:

```sql
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    course VARCHAR(100) NOT NULL,
    year_level INT NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Environment Variables
Create a `.env` file in the root directory (do not commit this to GitHub) and add your Aiven MySQL connection string:

```env
MYSQL_URL=mysql://vnadmin:your_password@mysql-instance.aivencloud.com:port/defaultdb?ssl={"rejectUnauthorized":true}
```

### 4. Local Development
```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

### 5. Production Deployment
1. Push your code to a public GitHub repository.
2. Connect the repository to **Render**.
3. In Render Dashboard, go to **Environment** and add the `MYSQL_URL` variable.
4. Set the **Build Command** to: `npm install && npm run build`
5. Set the **Start Command** to: `npm start`

## CRUD Operations
- **CREATE:** Handled via the "Register Student" form.
- **READ:** Displays all students in the "Student List" table.
- **UPDATE:** Access via the edit icon in the student table.
- **DELETE:** Access via the trash icon in the student table.

## Authors
- **Student Name:** [Your Name]
- **Course:** IT318 - Web Development
