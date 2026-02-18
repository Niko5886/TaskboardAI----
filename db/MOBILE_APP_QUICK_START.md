# 📱 Mobile App Development - Quick Start Guide

## 🎯 Какво е това?

Това е готов проект template за управление на задачи при разработка на мобилно приложение, интегриран в Taskboard системата.

## ⚡ Бърз старт (3 стъпки)

### Стъпка 1️⃣: Изпълни миграцията
Отвори Supabase SQL Editor и копирай/изпълни:
```
db/migrations/20260218_007_add_mobile_app_project.sql
```

### Стъпка 2️⃣: Влез в Taskboard
```
http://localhost:5173
```

### Стъпка 3️⃣: Отвори проекта
Навигирай до **Projects** → **Mobile App Development**

## 🎨 Визуализация на проекта

```
📱 Mobile App Development
│
├── 📋 Backlog (4 задачи)
│   ├── ⚙️  Setup React Native environment
│   ├── 🏗️  Design app architecture
│   ├── 🎨 Create wireframes and mockups
│   └── 🔄 Setup CI/CD pipeline
│
├── 💻 In Development (5 задачи)
│   ├── 🔐 Implement authentication flow
│   ├── 🧭 Create navigation system
│   ├── 🏠 Build home screen UI
│   ├── 🌐 Integrate REST API
│   └── 🔔 Implement push notifications
│
├── 🧪 Testing (3 задачи)
│   ├── 🤖 Test on Android devices
│   ├── 🍎 Test on iOS devices
│   └── ⚡ Performance optimization
│
└── ✅ Completed (3 задачи)
    ├── ✓ Setup project repository
    ├── ✓ Install dependencies
    └── ✓ Configure ESLint and Prettier
```

## 📋 Кратки команди

### Добави проекта чрез Node.js:
```bash
node db/seed-mobile-app.js
```

### Провери дали проектът е добавен:
```bash
# Отвори Supabase SQL Editor и изпълни:
SELECT * FROM projects WHERE title = 'Mobile App Development';
```

### Виж всички задачи:
```bash
# В Supabase SQL Editor:
SELECT t.title, ps.title as stage 
FROM tasks t 
JOIN project_stages ps ON t.stage_id = ps.id 
WHERE t.project_id = '660e8400-e29b-41d4-a716-446655440004';
```

## 🎯 Основни функции

| Функция | Описание | Статус |
|---------|----------|--------|
| Drag & Drop | Местене на задачи между етапи | ✅ Готово |
| Task Edit | Редактиране на задачи | ✅ Готово |
| Task Delete | Изтриване на задачи | ✅ Готово |
| Stage Management | Добавяне/редактиране на етапи | ✅ Готово |
| Progress Tracking | Автоматично проследяване | ✅ Готово |

## 🗂️ Файлова структура

```
db/
├── migrations/
│   └── 20260218_007_add_mobile_app_project.sql
│       └── 📄 SQL миграция за добавяне на проекта
│
├── seed-mobile-app.js
│   └── 🔧 Node.js скрипт за автоматично добавяне
│
├── MOBILE_APP_PROJECT.md
│   └── 📚 Пълна документация (български)
│
├── MOBILE_APP_SUMMARY.md
│   └── 📊 Обобщение и статистика
│
└── MOBILE_APP_QUICK_START.md (този файл)
    └── ⚡ Бърз старт guide
```

## 🎓 За напреднали

### Персонализация на задачи
Редактирай миграционния файл и промени:
- `title` - заглавията на задачите
- `description_html` - описанията
- `position` - реда на задачите
- `done` - дали са завършени

### Добави нови етапи
```sql
INSERT INTO project_stages (project_id, title, position)
VALUES ('660e8400-e29b-41d4-a716-446655440004', 'Code Review', 3);
```

### Добави нови задачи
```sql
INSERT INTO tasks (project_id, stage_id, title, description_html, position, done)
VALUES (
  '660e8400-e29b-41d4-a716-446655440004',
  'your-stage-id',
  'Your Task Title',
  '<p>Task description</p>',
  1,
  false
);
```

## 🆘 Често срещани проблеми

### Проблем: "User not found"
**Решение:** Замени `owner_id` в миграцията с твоя user ID от Supabase Auth

### Проблем: "RLS policy violation"
**Решение:** Уверете се, че са изпълнени всички предишни миграции

### Проблем: "Project not visible"
**Решение:** Провери дали си логнат като правилния потребител

## 📞 Допълнителна помощ

- 📖 Пълна документация: [MOBILE_APP_PROJECT.md](MOBILE_APP_PROJECT.md)
- 📊 Статистика: [MOBILE_APP_SUMMARY.md](MOBILE_APP_SUMMARY.md)
- 🏠 Главен README: [../README.md](../README.md)

## 🎉 Готово!

След изпълнение на миграцията, проектът "Mobile App Development" ще е напълно функционален и готов за използване в Taskboard!

---

**Tip:** Можеш да създадеш подобни проекти за други области, като копираш и адаптираш миграционния файл! 🚀
