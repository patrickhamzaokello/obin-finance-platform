# Obin Finance Admin Panel Guide

## Overview
The admin panel allows authorized administrators to manage courses, modules, videos, PDFs, and users in the Obin Finance Learning Platform.

## Accessing the Admin Panel

1. Sign in with your admin account at `https://yourapp.com/sign-in`
2. If your account has admin privileges, you'll be automatically redirected to `/admin`
3. If you're a learner, you won't see the admin option

## Admin Dashboard (`/admin`)

The main admin dashboard shows key statistics and quick links:

### Statistics Cards
- **Total Courses**: Number of all courses in the system
- **Published Courses**: Count of courses that are live
- **Total Users**: All registered learners and admins
- **Admin Users**: Number of administrative accounts

### Recent Courses
A table showing the 5 most recently created courses with:
- Course title
- Instructor name
- Publication status (Published/Draft)
- Creation date
- Quick edit link

### Quick Links
- **Course Management**: Link to manage all courses
- **User Management**: Link to manage user accounts

---

## Course Management (`/admin/courses`)

### Features

#### Search & Filter
- **Search Courses**: Find courses by title or description
- **Status Filter**: View all, published, or draft courses

#### Course List View
Each course card displays:
- Course thumbnail (or placeholder)
- Course title
- Description preview
- Instructor name
- Publication status badge
- Edit and Delete buttons

#### Creating a New Course

1. Click **"+ Create New Course"** button
2. Fill in course details:
   - **Title** (required): Course name
   - **Description**: What the course covers
   - **Thumbnail URL**: Image for the course card
   - **Instructor**: Instructor name
3. Click **"Save Course"** to create
4. You'll be redirected back to the courses list
5. Click Edit on your new course to add modules and content

#### Editing a Course

1. From the courses list, click **Edit** on any course
2. You can update:
   - Course title, description, thumbnail, and instructor
   - Publication status (toggle to publish/unpublish)
   - Add/remove modules

### Module Management

#### Adding a Module

1. Open a course for editing
2. In the "Modules" section, click **"Add Module"**
3. Fill in:
   - **Module Title** (required): Name of this learning section
   - **Description**: What this module covers
4. Click **"Create Module"**

#### Managing Module Content

Each expanded module shows:

##### Adding Videos
1. Click **"Add Video"** button in the Videos section
2. Enter:
   - **Video Title**: Name of the video
   - **Video URL**: Link to YouTube, Vimeo, or other video hosting
3. Click **"Add Video"**

##### Adding PDFs
1. Click **"Add PDF"** button in the PDFs section
2. Enter:
   - **PDF Title**: Name of the document
   - **PDF URL**: Link to the PDF file
3. Click **"Add PDF"**

#### Video/PDF URLs Examples
- **YouTube**: `https://www.youtube.com/watch?v=VIDEO_ID`
- **Vimeo**: `https://vimeo.com/VIDEO_ID`
- **AWS S3**: `https://your-bucket.s3.amazonaws.com/file.mp4`
- **Any HTTPS URL**: Direct link to video or PDF file

#### Removing Content
Click the delete button next to any module, video, or PDF (future versions will have this)

---

## User Management (`/admin/users`)

### Features

#### User List
View all registered users with:
- Email address
- Full name (if provided)
- Current role (Learner/Admin)
- Registration date
- Action buttons

#### Changing User Roles

1. Go to **User Management** (`/admin/users`)
2. Find the user you want to modify
3. Click the **role dropdown** (shows "Learner" or "Admin")
4. Select the new role
5. Changes are saved automatically

### Role Descriptions

- **Learner**: Can enroll in courses and view course content
- **Admin**: Can create/edit courses, manage users, and access admin panel

#### Making Someone an Admin
1. Find the user in the list
2. Click their role dropdown
3. Select "Admin"
4. They'll now have access to the admin panel on their next login

#### Revoking Admin Access
1. Find the admin user
2. Click their role dropdown
3. Select "Learner"
4. They'll lose admin access immediately

---

## Best Practices

### Course Organization
1. **Create clear module structure**: Break courses into logical modules
2. **Use descriptive titles**: Titles should indicate what learners will learn
3. **Order your content**: Modules are displayed in creation order
4. **Draft before publishing**: Always preview and test before publishing

### Video Hosting
- Use reliable video hosting services (YouTube, Vimeo, AWS, etc.)
- Ensure videos are publicly accessible
- Keep video sizes reasonable for streaming
- Use descriptive titles

### PDF Management
- Ensure PDFs are accessible (publicly viewable)
- Use clear naming conventions
- Compress PDFs for faster downloads
- Organize related documents together

### User Management
- Regularly review admin access
- Only promote trusted users to admin
- Archive courses instead of deleting if they contain learner data

---

## Troubleshooting

### Can't access the admin panel?
- Verify your account has admin role
- Check if you're logged in
- Try logging out and back in

### Course not visible to learners?
- Make sure the course is set to **Published**
- Check that at least one module is created
- Verify course has content (videos or PDFs)

### Video not playing?
- Confirm the video URL is correct and publicly accessible
- Check that the URL works in your browser
- Try a different video hosting service

### Can't upload files?
- The system currently uses URL-based content
- Host your videos/PDFs on external services
- Paste the public URL in the admin panel

---

## Tips & Tricks

1. **Quick course cloning**: Edit an existing course and save with a new title
2. **Draft mode**: Use "Draft" status to work on courses before launching
3. **Bulk operations**: Use search to quickly find courses to modify
4. **Admin team**: Promote multiple trusted team members to admin
5. **Regular backups**: Keep backups of important course content URLs

---

## Support

For issues or questions:
1. Check this guide first
2. Verify environment variables are set
3. Check application logs
4. Contact support if problems persist

Last Updated: June 2026
