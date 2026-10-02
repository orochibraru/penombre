// Prints a pairing link for the test account: what the web app's "Connect the
// mobile app" dialog shows as a QR code. Run by run.sh for the pairing flow.
const server = process.env.PENOMBRE_E2E_SERVER ?? "http://localhost:5173";
const headers = { "content-type": "application/json", origin: server };

const signedIn = await fetch(`${server}/api/v1/auth/sign-in/email`, {
	method: "POST",
	headers,
	body: JSON.stringify({
		email: process.env.PENOMBRE_E2E_EMAIL,
		password: process.env.PENOMBRE_E2E_PASSWORD,
	}),
});
const { token } = await signedIn.json();
const auth = { ...headers, authorization: `Bearer ${token}` };
const paired = await fetch(`${server}/api/v1/mobile/pair`, {
	method: "POST",
	headers: auth,
});
if (!paired.ok) {
	process.stderr.write(`No pairing code: ${paired.status}\n`);
	process.exit(1);
}
const { data } = await paired.json();
// The code belongs to the account, not to this session.
await fetch(`${server}/api/v1/auth/sign-out`, {
	method: "POST",
	headers: auth,
	body: "{}",
});
process.stdout.write(data.url);
