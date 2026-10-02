// What the flows changed must have reached the server, not just the screen.
// Run by run.sh after each platform's flow.
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
const { data } = await (
	await fetch(`${server}/api/v1/preferences`, { headers: auth })
).json();
await fetch(`${server}/api/v1/auth/sign-out`, {
	method: "POST",
	headers: auth,
	body: "{}",
});

// The flow picks blue, then bordeaux again: both saves must have landed.
if (data.accent !== "bordeaux") {
	process.stderr.write(
		`The account's accent is ${data.accent}, not bordeaux: a save from Settings was lost.\n`,
	);
	process.exit(1);
}
process.stdout.write("Saved accent verified\n");
