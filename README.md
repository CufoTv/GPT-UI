
# GPT-5o Chatbot Demo

A client-side GPT-5o chatbot demo with user authentication, free/paid models, hourly message limits, and chat persistence. Built using vanilla JavaScript, HTML, and CSS with a simple localStorage-based backend.

---

## Features

### Authentication
- **Signup/Login** system with email and password.
- Passwords are stored in a simple hashed form (for demo purposes only).
- Admin account created automatically:  
  - Email: `admin@gmail.com`  
  - Password: `Admin123`

### User Types
- **Free users**: limited to **20 messages per hour**; only the basic GPT-5o-mini model available once limit is reached.
- **Paid users**: full access to GPT-5o model; can select between premium and mini models.

### Admin Panel
- Admin can **mark any user as paid**.
- Admin sees all user details (name, email, paid status).

### Chat Features
- Chat interface with **bot typing animation**.
- Uses **Markov-chain-based answer generation** for flexible responses.
- Tracks **messages per hour** and enforces limits for free users.
- **Persistent chat**: chat history is saved per user using localStorage.
- Unanswered questions are logged in `localStorage` for future training.

### Additional Features
- **Delete chat**: users can clear their chat history.
- **Theme toggle**: light/dark mode support.
- **Dynamic model selection**: premium users can choose active model.

---

## Data Files

### `data.json`
Seed data for users and admin:

```json
{
  "users": [
    {
      "name": "Admin",
      "email": "admin@gmail.com",
      "passwordHash": "QWRtaW4xMjM=", 
      "paid": true,
      "createdAt": 1693843200000,
      "messageLog": [],
      "activeModel": "GPT-5o"
    }
  ]
}
````

### `gpt-5o.json`

Question-answer dataset for the chatbot in the format:

```json
{
  "GPT-5o": [
    {
      "question": "What is GPT-5o?",
      "answer": "GPT-5o is a demo AI chatbot using Markov chains for flexible responses."
    }
  ]
}
```

---

## Usage

1. Clone the repository:

```bash
git clone https://github.com/CufoTv/GPT-UI.git
cd GPT-UI
```

2. Open `index.html` in your browser.

3. Signup or login using existing credentials (admin account available).

4. Start chatting with GPT-5o and test features like:

   * Sending messages
   * Exceeding free message limits
   * Switching models (paid users)
   * Deleting chat
   * Admin marking users as paid

---

## File Structure

```
gpt-5o-chatbot/
│
├─ index.html          # Main HTML file
├─ style.css           # Styles for chat UI
├─ script.js           # Main JS logic (auth, chat, persistence)
├─ data.json           # Seed user/admin data
├─ gpt-5o.json         # QA data for chatbot
└─ profile/            # Avatars for user and bot
   ├─ user.jpg
   └─ gpt-5o.jpg
```

---

## Notes

* This project is **client-side only**. All data is stored in `localStorage`.
* Passwords are **not secure**; do **not use real credentials**.
* Designed for demo and educational purposes.

---

## License

MIT License © 2025

