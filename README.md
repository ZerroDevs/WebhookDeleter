# Discord Webhook Manager

A modern, secure web application for managing Discord webhooks with features for deleting and sending messages. Built with Express.js and Supabase authentication.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- 🔒 **Secure Webhook Deletion**: Safely remove unwanted Discord webhooks
- 📨 **Message Sender**: Send custom messages through webhooks (requires authentication)
- 🎨 **Modern UI/UX**: Clean, responsive design with dark/light theme support
- 🔐 **Discord Authentication**: Secure login using Discord OAuth
- 🌐 **Cross-Platform**: Works on all modern browsers

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express.js
- **Authentication**: Supabase Auth
- **HTTP Client**: Axios
- **Additional**: Chart.js (for future analytics)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Discord application credentials
- Supabase account and project

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ZerroDevs/WebhookDeleter.git
cd WebhookDeleter
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

### Webhook Deletion
1. Navigate to the Webhook Deleter page
2. Enter the webhook URL you want to delete
3. Click "Delete Webhook"
4. Confirm the deletion

### Message Sending (Authenticated Users)
1. Log in with your Discord account
2. Navigate to the Webhook Sender page
3. Enter the webhook URL
4. Customize your message with:
   - Custom username
   - Avatar URL
   - Embed options
5. Click "Send Message"

## Security

- All requests are validated server-side
- CORS protection enabled
- Authentication required for sensitive operations
- Secure headers implemented
- Environment variables for sensitive data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

Created and maintained by [ZeroNux](https://github.com/ZerroDevs)

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.