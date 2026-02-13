# Taskboard
Taskboard is a Trello-style task management app built with JS and Supabase. Users register / login, then create projects, the view taskboard for each project, and create / edit / delete tasks on the taskboard. Tasks can be dragged and dropped between columns on the taskboard, and reordered within a column.

# Architecture and Tech Stack
 Classical client-server app:

-Front-end: JS app, Bootstrap, HTML, CSS,
-Back-end: Supabase
-Database: PostgreSQL
-Authentication: Supabase Auth
-Build tool: Vite, npm.
-API: Supabase REST API
-Hosting: Netlify
-Source code: GitHub

-Use a modular code structure, with separate files for different components, pages and features.Use ES6 modules to organize the code.

# Modules Design
Use modular code structure, with separate files for different components, pages and features. Use ES6 modules to organize the code.

# UI Guidelines

-Use HTML, CSS, Bootstrap and vanilla JS for the front-end.
-Use bootstrap components and utilities to create a responsive and user-friendly interface .
-Implement modern, responsive UI design with semantic HTML.
-Use a consistent color scheme and typography throughout the app.
-Use appropriate icons, effects and visual cues to enhance usability.

# Pages and Navigation

-Split the app into multiple pages: login, registration, project list, taskboard, admin panel etc.
-Implement pages as reusable components (HTML, CSS, JS code).
-Use routing to navigate between pages.
-Use full URLs like: /, /login, /register, /projects, /projects/(id)/tasks, /admin etc.

## Backend and Database
-Use Supabase as the backend and database for the app.
-Use PostgreSQL as the database, with tables for users, projects, and tasks, etc.
-Use Supabase Storage for file uploads (e.g. task attachments).
-When changing the database schema, always use migrations to keep track of changes.
-After applying a migration in Supabase , keep a copy of the migration SQL file in the code.                                                                                     Never edit existing migration sfter they have been applied --> create a new migration for any further changes to the database schema.


## Authentication and Authorization
-Use Supabase Auth for user authentication and authorization.
-Implement RLS policies to restrict access to data based on user roles and permissions.
-Implement user roles with separate DB table `userroles` + enum `roles` (e.g. admin, user).
