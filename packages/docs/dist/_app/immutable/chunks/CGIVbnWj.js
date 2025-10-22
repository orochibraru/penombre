import { f as v, a as h, n as t, g as a, b as e, s as r, j as C } from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as Zr, P as O } from './CXunQUVT.js';
import { H as T } from './CMbTFn8B.js';
import { A as d } from './Bva6-POL.js';
import { H as R } from './CTN7MPTR.js';
import { U as B } from './B2E1dnfA.js';
import { L as g } from './EJ1QvGwo.js';
import { S as D } from './Bqu0--pl.js';
import { B as S } from './C8yZ7dHE.js';
const to = { title: 'Changelog', description: 'Release notes for pocket-id' },
	{ title: al, description: dl } = to;
var eo = v('uploading a client logo with an URL fails (<!> by @CzBiX)', 1),
	ro = v('mark any callback url as valid if they contain a wildcard (<!> by @stonith404)', 1),
	oo = v('<!> <!>', 1),
	so = v('cleanup root of repo, update workflow actions (<!> by @kmendell)', 1),
	ao = v('<!>: <!>', 1),
	lo = v(
		"uploading a client logo with an URL fails if folder doesn't exist (<!> by @stonith404)",
		1
	),
	$o = v('add link to API docs on API key page (<!> by @stonith404)', 1),
	io = v('<!>: <!>', 1),
	co = v('do not use cache=shared for in-memory SQLite (<!> by @ItalyPaleAle)', 1),
	no = v(
		'show only country in audit log location if no city instead of Unknown (<!> by @vilisseranen)',
		1
	),
	uo = v(
		'display login location correctly if country or city is not present (<!> by @stonith404)',
		1
	),
	po = v('remove previous socket file to prevent bind error (<!> by @Caian)', 1),
	fo = v("tokens issued with refresh token flow don't contain groups (<!> by @ItalyPaleAle)", 1),
	ho = v('make logo and oidc client images sizes consistent (<!> by @stonith404)', 1),
	vo = v('include port in OIDC client details (<!> by @stonith404)', 1),
	_o = v('prevent endless effect loop in login wrapper (<!> by @stonith404)', 1),
	mo = v('improve back button handling on auth pages (<!> by @stonith404)', 1),
	bo = v('allow any image source but disallow base64 (<!> by @stonith404)', 1),
	go = v("date locale can't be loaded if locale is <!> (<!> by @stonith404)", 1),
	Po = v('<!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!>', 1),
	ko = v('support for url based icons (<!> by @kmendell)', 1),
	xo = v('hide alternative sign in methods page if email login disabled (<!> by @stonith404)', 1),
	yo = v('add required indicator for required inputs (<!> by @stonith404)', 1),
	wo = v('add the ability to make email optional (<!> by @stonith404)', 1),
	Fo = v('<!> <!> <!> <!>', 1),
	Io = v('fix whitespace after commit message (<!> by @stonith404)', 1),
	Ro = v('update AAGUIDs (<!> by @github-actions[bot])', 1),
	Bo = v('remove unnecessary logo fallback (<!> by @stonith404)', 1),
	Ao = v('<!> <!> <!>', 1),
	Oo = v('<!>: <!>', 1),
	To = v('embedded paths not found on windows (<!> by @stonith404)', 1),
	Co = v(
		'do not treat certain failures in app images bootstrap as fatal (<!> by @ItalyPaleAle)',
		1
	),
	Lo = v('decouple images from app config service (<!> by @stonith404)', 1),
	Do = v('<!> <!> <!>', 1),
	So = v('use git cliff for release notes (<!> by @stonith404)', 1),
	Uo = v('<!>: <!>', 1),
	qo = v(
		'[!NOTE]<br/> This release adds missing translations for <!> because I forgot to merge the PR before creating the release. See the release notes for <!> <!>.',
		1
	),
	zo = v('add missing translations (<!>)', 1),
	Eo = v('add CSP header (<!>) (<!>)', 1),
	No = v('add <!> env variable (<!> by @DerSteph)', 1),
	Go = v('add info box to app settings if UI config is disabled (<!>)', 1),
	jo = v('add PWA support (<!>) (<!>)', 1),
	Ho = v('add support for <!> env variable (<!>) (<!>)', 1),
	Jo = v('add user display name field (<!>) (<!>)', 1),
	Wo = v('allow uppercase usernames (<!>) (<!>)', 1),
	Mo = v('client_credentials flow support (<!> by @savely-krasovsky)', 1),
	Xo = v('return new id_token when using refresh token (<!>) (<!>)', 1),
	Yo = v('<!> <!> <!> <!> <!> <!> <!> <!> <!>', 1),
	Qo = v('add validation for callback URLs (<!>) (<!>)', 1),
	Ko = v('disable sign up options in UI if <!> (<!>)', 1),
	Vo = v('ensure users imported from LDAP have fields validated (<!>) (<!>)', 1),
	Zo = v("key-rotate doesn't work with database storage (<!>) (<!>)", 1),
	ts = v(
		'list items on previous page get unselected if other items selected on next page (<!>)',
		1
	),
	es = v('make environment variables case insensitive where necessary (<!>) (<!>)', 1),
	rs = v("my apps card shouldn't take full width if only one item exists (<!>)", 1),
	os = v('update localized name and description of ldap group name attribute (<!>) (<!>)', 1),
	ss = v('<!> <!> <!> <!> <!> <!> <!> <!>', 1),
	as = v('redesigned sidebar with administrative dropdown (<!>) (<!>)', 1),
	ds = v('apps showed multiple times if user is in multiple groups (<!>)', 1),
	ls = v(
		'[!WARNING]<br/> A bug was introduced in <!> that caused the deletion of all allowed user groups on OIDC clients. It is highly recommended to check if the allowed user groups are still in place. If they are not, unfortunately, the deleted relations cannot be restored automatically. You will need to either restore them from a backup or recreate them manually. You can learn more about the cause in this <!>.',
		1
	),
	$s = v('sqlite migration drops allowed user groups (<!>)', 1),
	is = v('support automatic db migration rollbacks (<!>) (<!>)', 1),
	cs = v("don't force uuid for client id in postgres (<!>)", 1),
	ns = v('ensure SQLite has a writable temporary directory (<!>) (<!>)', 1),
	us = v('sort order incorrect for apps when using postgres (<!>)', 1),
	ps = v('<!> <!> <!>', 1),
	fs = v('migration clears allowed users groups (<!>)', 1),
	hs = v('wrong column type for reauthentication tokens in Postgres (<!>) (<!>)', 1),
	vs = v('<!> <!>', 1),
	_s = v(
		'add option to OIDC client to require re-authentication (<!> by @MorrisMorrison) (<!>)',
		1
	),
	ms = v('allow custom client IDs (<!> thanks to @James18232) (<!>)', 1),
	bs = v('display all accessible oidc clients in the dashboard (<!>) (<!>)', 1),
	gs = v('login code font change (<!> by @James18232) (<!>)', 1),
	Ps = v('<!> add default user groups and claims for new users (<!> by @zeedif) (<!>)', 1),
	ks = v('<!> <!> <!> <!> <!>', 1),
	xs = v("authorization can't be revoked (<!>)", 1),
	ys = v('delete webauthn session after login to prevent replay attacks (<!>)', 1),
	ws = v('<!> bump rollup from 4.45.3 to 4.46.3 (<!> by @gepbird) (<!>)', 1),
	Fs = v('enable foreign key check for sqlite (<!>) (<!>)', 1),
	Is = v("ferated identities can't be cleared (<!>)", 1),
	Rs = v(
		'for one-time access tokens and signup tokens, pass TTLs instead of absolute expiration date (<!>) (<!>)',
		1
	),
	Bs = v('ignore client secret if client is public (<!> by @James18232) (<!>)', 1),
	As = v('move audit log call before TX is committed (<!>) (<!>)', 1),
	Os = v("non admin users can't revoke oidc client but see edit link (<!>)", 1),
	Ts = v('oidc client advanced options color (<!>)', 1),
	Cs = v('<!> <!> <!> <!> <!> <!> <!> <!> <!> <!>', 1),
	Ls = v('add robots.txt to block indexing (<!> by @Etienne-bdt) (<!>)', 1),
	Ds = v('add support for <!> (<!>) (<!>)', 1),
	Ss = v('Support OTel and JSON for logs (via log/slog) (<!>) (<!>)', 1),
	Us = v('support reading secret env vars from _FILE (<!>) (<!>)', 1),
	qs = v('user application dashboard (<!>) (<!>)', 1),
	zs = v('<!> <!> <!> <!> <!>', 1),
	Es = v('admins can not delete or disable their own account (<!>)', 1),
	Ns = v('authorization animation not working (<!>)', 1),
	Gs = v('custom claims input suggestions instantly close after opening (<!>)', 1),
	js = v('delete WebAuthn registration session after use (<!>) (<!>)', 1),
	Hs = v("set input type 'email' for email-based login (<!>) (<!>)", 1),
	Js = v('<!> <!> <!> <!> <!>', 1),
	Ws = v('migration fails on postgres (<!>) (<!>)', 1),
	Ms = v('allow passkey names up to 50 characters (<!>)', 1),
	Xs = v('ensure user inputs are normalized (<!>) (<!>)', 1),
	Ys = v('show rename and delete buttons for passkeys without hovering over the row (<!>)', 1),
	Qs = v('use object-contain for images on oidc-client list (<!>)', 1),
	Ks = v('use user-agent for identifying known device signins (<!>)', 1),
	Vs = v('<!> <!> <!> <!> <!>', 1),
	Zs = v('ensure confirmation dialog shows on top of other components (<!>)', 1),
	ta = v('login failures on Postgres when IP is null (<!>) (<!>)', 1),
	ea = v('<!> <!>', 1),
	ra = v(
		'[!NOTE]<br/> This release is the same as <!> but the images are now tagged correctly. There was an issue that the <!> tag was added to the distroless image instead of the regular one.',
		1
	),
	oa = v('add support for OAuth 2.0 Authorization Server Issuer Identification (<!>)', 1),
	sa = v('add distroless container additional variant + healthcheck command (<!>)', 1),
	aa = v('encrypt private keys saved on disk and in database (<!>)', 1),
	da = v('enhance language selection message and add translation contribution link (<!>)', 1),
	la = v('add "key-rotate" command (<!>)', 1),
	$a = v('<!> <!> <!> <!> <!>', 1),
	ia = v('allow profile picture update even if "allow own account edit" enabled (<!>)', 1),
	ca = v('app config forms not updating with latest values (<!>)', 1),
	na = v('auth fails when client IP is empty on Postgres (<!>)', 1),
	ua = v('custom claims input suggestions flickering (<!>)', 1),
	pa = v('keep sidebar in settings sticky (<!>)', 1),
	fa = v('show friendly name in user group selection (<!>)', 1),
	ha = v('support non UTF-8 LDAP IDs (<!>)', 1),
	va = v('token introspection authentication not handled correctly (<!>)', 1),
	_a = v('<!> <!> <!> <!> <!> <!> <!> <!>', 1),
	ma = v('add self-service signup with token and open registration modes (<!>)', 1),
	ba = v('improve initial admin creation workflow (<!>)', 1),
	ga = v('redact sensitive app config variables if set with env variable (<!>)', 1),
	Pa = v('<!> <!> <!>', 1),
	ka = v('error page flickering after sign out (<!>)', 1),
	xa = v('improve accent color picker disabled state (<!>)', 1),
	ya = v('less noisy logging for certain GET requests (<!> by @11notes)', 1),
	wa = v('margin of user sign up description (<!>)', 1),
	Fa = v('remove duplicate request logging (<!> by @ryankask)', 1),
	Ia = v("users can't be updated by admin if self account editing is disabled (<!>)", 1),
	Ra = v('<!> <!> <!> <!> <!> <!>', 1),
	Ba = v('app not starting if UI config is disabled and Postgres is used (<!>)', 1),
	Aa = v('allow setting unix socket mode (<!> by @CnTeng) (<!>)', 1),
	Oa = v('auto-focus on the login buttons (<!> By @ItalyPaleAle) (<!>)', 1),
	Ta = v('configurable local ipv6 ranges for audit log (<!>) (<!>)', 1),
	Ca = v('location filter for global audit log (<!>) (<!>)', 1),
	La = v('ui accent colors (<!>) (<!>)', 1),
	Da = v('use icon instead of text on application image update hover state (<!>)', 1),
	Sa = v('<!> <!> <!> <!> <!> <!>', 1),
	Ua = v('allow images with uppercase file extension (<!>)', 1),
	qa = v('center oidc client images if they are smaller than the box (<!>)', 1),
	za = v('explicitly cache images to prevent unexpected behavior (<!>)', 1),
	Ea = v(
		'reduce duration of animations on login and signin page (<!> By @ItalyPaleAle) (<!>)',
		1
	),
	Na = v('<!> <!> <!> <!>', 1),
	Ga = v('change timestamp of <!> migration (<!>)', 1),
	ja = v('add API endpoint for user authorized clients (<!>)', 1),
	Ha = v('add unix socket support (<!> by @CnTeng)', 1),
	Ja = v('JWT bearer assertions for client authentication (<!> by @ItalyPaleAle)', 1),
	Wa = v('new color theme for the UI (<!>)', 1),
	Ma = v('oidc client data preview (<!>)', 1),
	Xa = v('<!> <!> <!> <!> <!>', 1),
	Ya = v("don't load app config and user on every route change (<!>)", 1),
	Qa = v('misleading text for disable animations option (<!>)', 1),
	Ka = v("OIDC client image can't be deleted (<!>)", 1),
	Va = v("UI config overridden by env variables don't apply on first start (<!>)", 1),
	Za = v('<!> <!> <!> <!>', 1),
	td = v('auto detect callback url (<!>)', 1),
	ed = v('allow users to update their locale even when own account update disabled (<!>)', 1),
	rd = v('clear default app config variables from database (<!>)', 1),
	od = v(
		'fallback to primary language if no translation available for specific country (<!>)',
		1
	),
	sd = v('improve spacing on auth screens (<!>)', 1),
	ad = v('page scrolls up on form submission (<!>)', 1),
	dd = v('run jobs at interval instead of specific time (<!> by @ItalyPaleAle)', 1),
	ld = v('show LAN for auditlog location for internal networks (<!>)', 1),
	$d = v('small fixes in analytics_job (<!> by @ItalyPaleAle)', 1),
	id = v('whitelist authorization header for CORS (<!>)', 1),
	cd = v('<!> <!> <!> <!> <!> <!> <!> <!> <!>', 1),
	nd = v(
		'[!NOTE]<br/> This version introduces a heartbeat request that gets sent once everyday to the <!> to count how many instances of Opendrive exist. The heartbeat request only contains a random instance ID, the version of Opendrive and when it was first/last seen. Seeing how many active Opendrive instances are out there genuinely motivates us to keep developing and maintaining the project. Of course this heartbeat can also be disabled by setting <!> to <!>. For more information visit the <!>.',
		1
	),
	ud = v('add daily heartbeat request for counting Opendrive instances (<!>)', 1),
	pd = v('require user verification for passkey sign in (<!>)', 1),
	fd = v('show allowed group count on oidc client list (<!>) (<!>)', 1),
	hd = v('<!> <!> <!>', 1),
	vd = v('use ldapAttributeUserUsername for finding group members (<!>)', 1),
	_d = v(
		`[!WARNING]<br/> This release contains breaking changes and Opendrive won't work correctly if you don't follow the migration steps.
 → Please follow the <!>.`,
		1
	),
	md = v('animation speed set to max of 300ms (<!>)', 1),
	bd = v('custom logo not correctly loaded if UI configuration is disabled (<!>)', 1),
	gd = v('show correct app name on sign out page (<!>)', 1),
	Pd = v('trim whitespaces from string inputs (<!>)', 1),
	kd = v('<!> <!> <!> <!>', 1),
	xd = v('add support for <!> environment variable (<!>)', 1),
	yd = v('handle CORS correctly for endpoints that SPAs need (<!>)', 1),
	wd = v('add healthz endpoint (<!> by @ItalyPaleAle)', 1),
	Fd = v('add OpenTelemetry tracing and metrics (<!> by @daenney)', 1),
	Id = v('<!> <!>', 1),
	Rd = v('correctly set script permissions inside Docker container (<!>)', 1),
	Bd = v('allow LDAP users to update their locale (<!>)', 1),
	Ad = v('last name still showing as required on account form (<!>)', 1),
	Od = v("non admin users weren't able to call the end session endpoint (<!>)", 1),
	Td = v('<!> <!> <!>', 1),
	Cd = v('new login code card position for mobile devices (<!> by @James18232)', 1),
	Ld = v('do not require PKCE for public clients (<!>)', 1),
	Dd = v('hide global audit log switch for non admin users (<!>)', 1),
	Sd = v("return correct error message if user isn't authorized (<!>)", 1),
	Ud = v('updating scopes of an authorized client fails with Postgres (<!>)', 1),
	qd = v('<!> <!> <!> <!>', 1),
	zd = v('device authorization endpoint (<!>)', 1),
	Ed = v('make family name optional (<!>)', 1),
	Nd = v('<!> <!>', 1),
	Gd = v('do not override XDG_DATA_HOME/XDG_CONFIG_HOME if they are already set (<!> by @it)', 1),
	jd = v('pass context to methods that were missing it (<!> by @ItalyPaleAle)', 1),
	Hd = v('prevent deadlock when trying to delete LDAP users (<!> by @ItalyPaleAle)', 1),
	Jd = v('rootless Caddy data and configuration (<!> by @eiqnepm)', 1),
	Wd = v('<!> <!> <!> <!> <!>', 1),
	Md = v(
		'<!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!>',
		1
	);
function ll(Qr) {
	Zr(Qr, {
		children: (Kr, Xd) => {
			var U = Md(),
				q = h(U);
			T(q, {
				id: 'v1131---2025-10-07',
				children: (s, b) => {
					t();
					var o = a('v1.13.1 - 2025-10-07');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var z = r(q, 2);
			O(z, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.13.1',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var E = r(z, 2);
			R(E, {
				id: 'bug-fixes',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var N = r(E, 2);
			B(N, {
				children: (s, b) => {
					var o = oo(),
						k = h(o);
					g(k, {
						children: (P, x) => {
							t();
							var m = eo(),
								$ = r(h(m));
							(d($, {
								href: 'https://github.com/pocket-id/pocket-id/pull/1008',
								children: (f, i) => {
									t();
									var l = a('#1008');
									e(f, l);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(P, m));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					(g(u, {
						children: (P, x) => {
							t();
							var m = ro(),
								$ = r(h(m));
							(d($, {
								href: 'https://github.com/pocket-id/pocket-id/pull/1006',
								children: (f, i) => {
									t();
									var l = a('#1006');
									e(f, l);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(P, m));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var G = r(N, 2);
			R(G, {
				id: 'other',
				children: (s, b) => {
					t();
					var o = a('Other');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var j = r(G, 2);
			B(j, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = so(),
								P = r(h(u));
							(d(P, {
								href: 'https://github.com/pocket-id/pocket-id/pull/1003',
								children: (x, m) => {
									t();
									var $ = a('#1003');
									e(x, $);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var H = r(j, 2);
			O(H, {
				children: (s, b) => {
					var o = ao(),
						k = h(o);
					D(k, {
						children: (P, x) => {
							t();
							var m = a('Full Changelog');
							e(P, m);
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					(d(u, {
						href: 'https://github.com/pocket-id/pocket-id/compare/v1.13.0...v1.13.1',
						children: (P, x) => {
							t();
							var m = a(
								'https://github.com/pocket-id/pocket-id/compare/v1.13.0...v1.13.1'
							);
							e(P, m);
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var J = r(H, 2);
			T(J, {
				id: 'v1130---2025-10-05',
				children: (s, b) => {
					t();
					var o = a('v1.13.0 - 2025-10-05');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var W = r(J, 2);
			O(W, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.13.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var M = r(W, 2);
			R(M, {
				id: 'bug-fixes-1',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var X = r(M, 2);
			B(X, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = lo(),
								P = r(h(u));
							(d(P, {
								href: 'https://github.com/pocket-id/pocket-id/commit/ad8a90c839cc79b542b60ae66c7eb9254fa5f3e4',
								children: (x, m) => {
									t();
									var $ = a('ad8a90c');
									e(x, $);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Y = r(X, 2);
			R(Y, {
				id: 'features',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Q = r(Y, 2);
			B(Q, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = $o(),
								P = r(h(u));
							(d(P, {
								href: 'https://github.com/pocket-id/pocket-id/commit/2c74865173344766bd43ffd6ae6d93d564de47c7',
								children: (x, m) => {
									t();
									var $ = a('2c74865');
									e(x, $);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var K = r(Q, 2);
			O(K, {
				children: (s, b) => {
					var o = io(),
						k = h(o);
					D(k, {
						children: (P, x) => {
							t();
							var m = a('Full Changelog');
							e(P, m);
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					(d(u, {
						href: 'https://github.com/pocket-id/pocket-id/compare/v1.12.0...v1.13.0',
						children: (P, x) => {
							t();
							var m = a(
								'https://github.com/pocket-id/pocket-id/compare/v1.12.0...v1.13.0'
							);
							e(P, m);
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var V = r(K, 2);
			T(V, {
				id: 'v1120---2025-10-03',
				children: (s, b) => {
					t();
					var o = a('v1.12.0 - 2025-10-03');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Z = r(V, 2);
			O(Z, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.12.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var tt = r(Z, 2);
			R(tt, {
				id: 'bug-fixes-2',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var et = r(tt, 2);
			B(et, {
				children: (s, b) => {
					var o = Po(),
						k = h(o);
					g(k, {
						children: (n, _) => {
							t();
							var y = co(),
								w = r(h(y));
							(d(w, {
								href: 'https://github.com/pocket-id/pocket-id/pull/971',
								children: (F, I) => {
									t();
									var A = a('#971');
									e(F, A);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(n, y));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (n, _) => {
							t();
							var y = no(),
								w = r(h(y));
							(d(w, {
								href: 'https://github.com/pocket-id/pocket-id/pull/977',
								children: (F, I) => {
									t();
									var A = a('#977');
									e(F, A);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(n, y));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: (n, _) => {
							t();
							var y = uo(),
								w = r(h(y));
							(d(w, {
								href: 'https://github.com/pocket-id/pocket-id/commit/79989fb176273cef070dc52c338004b443364db8',
								children: (F, I) => {
									t();
									var A = a('79989fb');
									e(F, A);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(n, y));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					g(x, {
						children: (n, _) => {
							t();
							var y = po(),
								w = r(h(y));
							(d(w, {
								href: 'https://github.com/pocket-id/pocket-id/pull/979',
								children: (F, I) => {
									t();
									var A = a('#979');
									e(F, A);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(n, y));
						},
						$$slots: { default: !0 }
					});
					var m = r(x, 2);
					g(m, {
						children: (n, _) => {
							t();
							var y = fo(),
								w = r(h(y));
							(d(w, {
								href: 'https://github.com/pocket-id/pocket-id/pull/989',
								children: (F, I) => {
									t();
									var A = a('#989');
									e(F, A);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(n, y));
						},
						$$slots: { default: !0 }
					});
					var $ = r(m, 2);
					g($, {
						children: (n, _) => {
							t();
							var y = ho(),
								w = r(h(y));
							(d(w, {
								href: 'https://github.com/pocket-id/pocket-id/commit/01db8c0a46b69a15a40951ba863e6bc08fa8e1f8',
								children: (F, I) => {
									t();
									var A = a('01db8c0');
									e(F, A);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(n, y));
						},
						$$slots: { default: !0 }
					});
					var f = r($, 2);
					g(f, {
						children: (n, _) => {
							t();
							var y = vo(),
								w = r(h(y));
							(d(w, {
								href: 'https://github.com/pocket-id/pocket-id/commit/2c1c67b5e403b365204854c5eb222a68236f3ce0',
								children: (F, I) => {
									t();
									var A = a('2c1c67b');
									e(F, A);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(n, y));
						},
						$$slots: { default: !0 }
					});
					var i = r(f, 2);
					g(i, {
						children: (n, _) => {
							t();
							var y = _o(),
								w = r(h(y));
							(d(w, {
								href: 'https://github.com/pocket-id/pocket-id/commit/fc9939d1f1817c0b014cc54e6525b98762835295',
								children: (F, I) => {
									t();
									var A = a('fc9939d');
									e(F, A);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(n, y));
						},
						$$slots: { default: !0 }
					});
					var l = r(i, 2);
					g(l, {
						children: (n, _) => {
							t();
							var y = mo(),
								w = r(h(y));
							(d(w, {
								href: 'https://github.com/pocket-id/pocket-id/commit/d47b20326f96b6fff405fcc211719bf3068085ee',
								children: (F, I) => {
									t();
									var A = a('d47b203');
									e(F, A);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(n, y));
						},
						$$slots: { default: !0 }
					});
					var p = r(l, 2);
					g(p, {
						children: (n, _) => {
							t();
							var y = bo(),
								w = r(h(y));
							(d(w, {
								href: 'https://github.com/pocket-id/pocket-id/commit/22f42549323fde8b9eaeff682bfa4c7f27e05526',
								children: (F, I) => {
									t();
									var A = a('22f4254');
									e(F, A);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(n, y));
						},
						$$slots: { default: !0 }
					});
					var c = r(p, 2);
					(g(c, {
						children: (n, _) => {
							t();
							var y = go(),
								w = r(h(y));
							C(w, () => '<code>en</code>');
							var F = r(w, 2);
							(d(F, {
								href: 'https://github.com/pocket-id/pocket-id/commit/b81de451668c425bfc5ca7cd6071fe2756b31594',
								children: (I, A) => {
									t();
									var L = a('b81de45');
									e(I, L);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(n, y));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var rt = r(et, 2);
			R(rt, {
				id: 'features-1',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var ot = r(rt, 2);
			B(ot, {
				children: (s, b) => {
					var o = Fo(),
						k = h(o);
					g(k, {
						children: (m, $) => {
							t();
							var f = ko(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/pull/840',
								children: (l, p) => {
									t();
									var c = a('#840');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (m, $) => {
							t();
							var f = xo(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/d010be4c8804153b4a7f55bd4ea1cedb0df471df',
								children: (l, p) => {
									t();
									var c = a('d010be4');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: (m, $) => {
							t();
							var f = yo(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/pull/993',
								children: (l, p) => {
									t();
									var c = a('#993');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					(g(x, {
						children: (m, $) => {
							t();
							var f = wo(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/pull/994',
								children: (l, p) => {
									t();
									var c = a('#994');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var st = r(ot, 2);
			R(st, {
				id: 'other-1',
				children: (s, b) => {
					t();
					var o = a('Other');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var at = r(st, 2);
			B(at, {
				children: (s, b) => {
					var o = Ao(),
						k = h(o);
					g(k, {
						children: (x, m) => {
							t();
							var $ = Io(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/commit/e8b172f1c3df8eca8f463d7fa25a483b90a7e66c',
								children: (i, l) => {
									t();
									var p = a('e8b172f');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (x, m) => {
							t();
							var $ = Ro(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/pull/972',
								children: (i, l) => {
									t();
									var p = a('#972');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					(g(P, {
						children: (x, m) => {
							t();
							var $ = Bo(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/commit/b746ac0835da059e747a829df3a74e1eae79e107',
								children: (i, l) => {
									t();
									var p = a('b746ac0');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var dt = r(at, 2);
			R(dt, {
				id: 'sponsors',
				children: (s, b) => {
					t();
					var o = a('Sponsors');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var lt = r(dt, 2);
			O(lt, {
				children: (s, b) => {
					t();
					var o = a('Thanks @paradosi for your tip ❤️');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var $t = r(lt, 2);
			O($t, {
				children: (s, b) => {
					var o = Oo(),
						k = h(o);
					D(k, {
						children: (P, x) => {
							t();
							var m = a('Full Changelog');
							e(P, m);
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					(d(u, {
						href: 'https://github.com/pocket-id/pocket-id/compare/v1.11.2...v1.12.0',
						children: (P, x) => {
							t();
							var m = a(
								'https://github.com/pocket-id/pocket-id/compare/v1.11.2...v1.12.0'
							);
							e(P, m);
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var it = r($t, 2);
			T(it, {
				id: 'v1112---2025-09-20',
				children: (s, b) => {
					t();
					var o = a('v1.11.2 - 2025-09-20');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var ct = r(it, 2);
			O(ct, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.11.2',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var nt = r(ct, 2);
			R(nt, {
				id: 'bug-fixes-3',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var ut = r(nt, 2);
			B(ut, {
				children: (s, b) => {
					var o = Do(),
						k = h(o);
					g(k, {
						children: (x, m) => {
							t();
							var $ = To(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/commit/c55143d8c995fcd604edcdd448c50669e8682e33',
								children: (i, l) => {
									t();
									var p = a('c55143d');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (x, m) => {
							t();
							var $ = Co(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/pull/966',
								children: (i, l) => {
									t();
									var p = a('#966');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					(g(P, {
						children: (x, m) => {
							t();
							var $ = Lo(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/pull/965',
								children: (i, l) => {
									t();
									var p = a('#965');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var pt = r(ut, 2);
			R(pt, {
				id: 'other-2',
				children: (s, b) => {
					t();
					var o = a('Other');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var ft = r(pt, 2);
			B(ft, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = So(),
								P = r(h(u));
							(d(P, {
								href: 'https://github.com/pocket-id/pocket-id/commit/fde4e9b38a34331137a64ce328dad6faf9885808',
								children: (x, m) => {
									t();
									var $ = a('fde4e9b');
									e(x, $);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var ht = r(ft, 2);
			O(ht, {
				children: (s, b) => {
					var o = Uo(),
						k = h(o);
					D(k, {
						children: (P, x) => {
							t();
							var m = a('Full Changelog');
							e(P, m);
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					(d(u, {
						href: 'https://github.com/pocket-id/pocket-id/compare/v1.11.1...v1.11.2',
						children: (P, x) => {
							t();
							var m = a(
								'https://github.com/pocket-id/pocket-id/compare/v1.11.1...v1.11.2'
							);
							e(P, m);
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var vt = r(ht, 2);
			T(vt, {
				id: 'v1111---2025-09-18',
				children: (s, b) => {
					t();
					var o = a('v1.11.1 - 2025-09-18');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var _t = r(vt, 2);
			O(_t, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.11.1',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var mt = r(_t, 2);
			S(mt, {
				children: (s, b) => {
					O(s, {
						children: (o, k) => {
							t();
							var u = qo(),
								P = r(h(u), 3);
							C(P, () => '<code>v1.11.0</code>');
							var x = r(P, 2);
							C(x, () => '<code>v1.11.0</code>');
							var m = r(x, 2);
							(d(m, {
								href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.11.0',
								children: ($, f) => {
									t();
									var i = a('here');
									e($, i);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var bt = r(mt, 2);
			R(bt, {
				id: 'bug-fixes-4',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var gt = r(bt, 2);
			B(gt, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = zo(),
								P = r(h(u));
							(d(P, {
								href: 'https://github.com/pocket-id/pocket-id/commit/8c9cac2655ddbe4872234a1b55fdd51d2f3ac31c',
								children: (x, m) => {
									t();
									var $ = a('8c9cac2');
									e(x, $);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Pt = r(gt, 2);
			T(Pt, {
				id: 'v1110---2025-09-18',
				children: (s, b) => {
					t();
					var o = a('v1.11.0 - 2025-09-18');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var kt = r(Pt, 2);
			O(kt, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.11.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var xt = r(kt, 2);
			R(xt, {
				id: 'features-2',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var yt = r(xt, 2);
			B(yt, {
				children: (s, b) => {
					var o = Yo(),
						k = h(o);
					g(k, {
						children: (p, c) => {
							t();
							var n = Eo(),
								_ = r(h(n));
							d(_, {
								href: 'https://github.com/pocket-id/pocket-id/issues/908',
								children: (w, F) => {
									t();
									var I = a('#908');
									e(w, I);
								},
								$$slots: { default: !0 }
							});
							var y = r(_, 2);
							(d(y, {
								href: 'https://github.com/pocket-id/pocket-id/commit/6215e1ac01c03866f8b2e89ac084ddd6a3c3ac9e',
								children: (w, F) => {
									t();
									var I = a('6215e1a');
									e(w, I);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (p, c) => {
							t();
							var n = No(),
								_ = r(h(n));
							C(_, () => '<code>INTERNAL_APP_URL</code>');
							var y = r(_, 2);
							(d(y, {
								href: 'https://github.com/pocket-id/pocket-id/issues/858',
								children: (w, F) => {
									t();
									var I = a('#858');
									e(w, I);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: (p, c) => {
							t();
							var n = Go(),
								_ = r(h(n));
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/commit/a1d8538c64beb4d7e8559934985772fba27623ca',
								children: (y, w) => {
									t();
									var F = a('a1d8538');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					g(x, {
						children: (p, c) => {
							t();
							var n = jo(),
								_ = r(h(n));
							d(_, {
								href: 'https://github.com/pocket-id/pocket-id/issues/938',
								children: (w, F) => {
									t();
									var I = a('#938');
									e(w, I);
								},
								$$slots: { default: !0 }
							});
							var y = r(_, 2);
							(d(y, {
								href: 'https://github.com/pocket-id/pocket-id/commit/5367463239b354640fd65390bc409e4a0ac13fd1',
								children: (w, F) => {
									t();
									var I = a('5367463');
									e(w, I);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var m = r(x, 2);
					g(m, {
						children: (p, c) => {
							t();
							var n = Ho(),
								_ = r(h(n));
							C(_, () => '<code>LOG_LEVEL</code>');
							var y = r(_, 2);
							d(y, {
								href: 'https://github.com/pocket-id/pocket-id/issues/942',
								children: (F, I) => {
									t();
									var A = a('#942');
									e(F, A);
								},
								$$slots: { default: !0 }
							});
							var w = r(y, 2);
							(d(w, {
								href: 'https://github.com/pocket-id/pocket-id/commit/2d6d5df0e7f104a148fb4eeac89a2fbb7db8047a',
								children: (F, I) => {
									t();
									var A = a('2d6d5df');
									e(F, A);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var $ = r(m, 2);
					g($, {
						children: (p, c) => {
							t();
							var n = Jo(),
								_ = r(h(n));
							d(_, {
								href: 'https://github.com/pocket-id/pocket-id/issues/898',
								children: (w, F) => {
									t();
									var I = a('#898');
									e(w, I);
								},
								$$slots: { default: !0 }
							});
							var y = r(_, 2);
							(d(y, {
								href: 'https://github.com/pocket-id/pocket-id/commit/68373604dd30065947226922233bc1e19e778b01',
								children: (w, F) => {
									t();
									var I = a('6837360');
									e(w, I);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var f = r($, 2);
					g(f, {
						children: (p, c) => {
							t();
							var n = Wo(),
								_ = r(h(n));
							d(_, {
								href: 'https://github.com/pocket-id/pocket-id/issues/958',
								children: (w, F) => {
									t();
									var I = a('#958');
									e(w, I);
								},
								$$slots: { default: !0 }
							});
							var y = r(_, 2);
							(d(y, {
								href: 'https://github.com/pocket-id/pocket-id/commit/02249491f86c289adf596d9d9922dfa04779edee',
								children: (w, F) => {
									t();
									var I = a('0224949');
									e(w, I);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var i = r(f, 2);
					g(i, {
						children: (p, c) => {
							t();
							var n = Mo(),
								_ = r(h(n));
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/issues/901',
								children: (y, w) => {
									t();
									var F = a('#901');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var l = r(i, 2);
					(g(l, {
						children: (p, c) => {
							t();
							var n = Xo(),
								_ = r(h(n));
							d(_, {
								href: 'https://github.com/pocket-id/pocket-id/issues/925',
								children: (w, F) => {
									t();
									var I = a('#925');
									e(w, I);
								},
								$$slots: { default: !0 }
							});
							var y = r(_, 2);
							(d(y, {
								href: 'https://github.com/pocket-id/pocket-id/commit/307caaa3efbc966341b95ee4b5ff18c81ed98e54',
								children: (w, F) => {
									t();
									var I = a('307caaa');
									e(w, I);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var wt = r(yt, 2);
			R(wt, {
				id: 'bug-fixes-5',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Ft = r(wt, 2);
			B(Ft, {
				children: (s, b) => {
					var o = ss(),
						k = h(o);
					g(k, {
						children: (l, p) => {
							t();
							var c = Qo(),
								n = r(h(c));
							d(n, {
								href: 'https://github.com/pocket-id/pocket-id/issues/929',
								children: (y, w) => {
									t();
									var F = a('#929');
									e(y, F);
								},
								$$slots: { default: !0 }
							});
							var _ = r(n, 2);
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/commit/6c9147483c0a370e2b5011d13898279d2acc445d',
								children: (y, w) => {
									t();
									var F = a('6c91474');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (l, p) => {
							t();
							var c = Ko(),
								n = r(h(c));
							C(n, () => '<code>UI_CONFIG_DISABLED</code>');
							var _ = r(n, 2);
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/commit/1d7cbc2a4ecf352d46087f30b477f6bbaa23adf5',
								children: (y, w) => {
									t();
									var F = a('1d7cbc2');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: (l, p) => {
							t();
							var c = Vo(),
								n = r(h(c));
							d(n, {
								href: 'https://github.com/pocket-id/pocket-id/issues/923',
								children: (y, w) => {
									t();
									var F = a('#923');
									e(y, F);
								},
								$$slots: { default: !0 }
							});
							var _ = r(n, 2);
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/commit/42155238b750b015b0547294f397e1e285594e3e',
								children: (y, w) => {
									t();
									var F = a('4215523');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					g(x, {
						children: (l, p) => {
							t();
							var c = Zo(),
								n = r(h(c));
							d(n, {
								href: 'https://github.com/pocket-id/pocket-id/issues/940',
								children: (y, w) => {
									t();
									var F = a('#940');
									e(y, F);
								},
								$$slots: { default: !0 }
							});
							var _ = r(n, 2);
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/commit/c018f29ad7c61a3ef1b235b0d404a3a2024a26ca',
								children: (y, w) => {
									t();
									var F = a('c018f29');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					});
					var m = r(x, 2);
					g(m, {
						children: (l, p) => {
							t();
							var c = ts(),
								n = r(h(c));
							(d(n, {
								href: 'https://github.com/pocket-id/pocket-id/commit/6c696b46c8b60b3dc4af35c9c6cf1b8e1322f4cd',
								children: (_, y) => {
									t();
									var w = a('6c696b4');
									e(_, w);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					});
					var $ = r(m, 2);
					g($, {
						children: (l, p) => {
							t();
							var c = es(),
								n = r(h(c));
							d(n, {
								href: 'https://github.com/pocket-id/pocket-id/issues/954',
								children: (y, w) => {
									t();
									var F = a('#954');
									e(y, F);
								},
								$$slots: { default: !0 }
							});
							var _ = r(n, 2);
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/commit/99f31a7c26c63dec76682ddf450d88e6ee40876f',
								children: (y, w) => {
									t();
									var F = a('99f31a7');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					});
					var f = r($, 2);
					g(f, {
						children: (l, p) => {
							t();
							var c = rs(),
								n = r(h(c));
							(d(n, {
								href: 'https://github.com/pocket-id/pocket-id/commit/e7e53a8b8c87bee922167d24556aef3ea219b1a2',
								children: (_, y) => {
									t();
									var w = a('e7e53a8');
									e(_, w);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					});
					var i = r(f, 2);
					(g(i, {
						children: (l, p) => {
							t();
							var c = os(),
								n = r(h(c));
							d(n, {
								href: 'https://github.com/pocket-id/pocket-id/issues/892',
								children: (y, w) => {
									t();
									var F = a('#892');
									e(y, F);
								},
								$$slots: { default: !0 }
							});
							var _ = r(n, 2);
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/commit/e88be7e61a8aafabcae70adf9265023c50626705',
								children: (y, w) => {
									t();
									var F = a('e88be7e');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var It = r(Ft, 2);
			R(It, {
				id: 'sponsors-1',
				children: (s, b) => {
					t();
					var o = a('Sponsors');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Rt = r(It, 2);
			O(Rt, {
				children: (s, b) => {
					t();
					var o = a('Thank you @Felitendo very much for your tip!');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Bt = r(Rt, 2);
			T(Bt, {
				id: 'v1100---2025-08-27',
				children: (s, b) => {
					t();
					var o = a('v1.10.0 - 2025-08-27');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var At = r(Bt, 2);
			O(At, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.10.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Ot = r(At, 2);
			R(Ot, {
				id: 'features-3',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Tt = r(Ot, 2);
			B(Tt, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = as(),
								P = r(h(u));
							d(P, {
								href: 'https://github.com/pocket-id/pocket-id/issues/881',
								children: (m, $) => {
									t();
									var f = a('#881');
									e(m, f);
								},
								$$slots: { default: !0 }
							});
							var x = r(P, 2);
							(d(x, {
								href: 'https://github.com/pocket-id/pocket-id/commit/096d214a88808848dae726b0ef4c9a9987185836',
								children: (m, $) => {
									t();
									var f = a('096d214');
									e(m, f);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Ct = r(Tt, 2);
			R(Ct, {
				id: 'bug-fixes-6',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Lt = r(Ct, 2);
			B(Lt, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = ds(),
								P = r(h(u));
							(d(P, {
								href: 'https://github.com/pocket-id/pocket-id/commit/641bbc935191bad8afbfec90943fc3e9de7a0cb6',
								children: (x, m) => {
									t();
									var $ = a('641bbc9');
									e(x, $);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Dt = r(Lt, 2);
			T(Dt, {
				id: 'v191---2025-08-24',
				children: (s, b) => {
					t();
					var o = a('v1.9.1 - 2025-08-24');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var St = r(Dt, 2);
			O(St, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.9.1',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Ut = r(St, 2);
			S(Ut, {
				children: (s, b) => {
					O(s, {
						children: (o, k) => {
							t();
							var u = ls(),
								P = r(h(u), 3);
							C(P, () => '<code>v1.8.0</code>');
							var x = r(P, 2);
							(d(x, {
								href: 'https://github.com/pocket-id/pocket-id/issues/865#issuecomment-3218287796',
								children: (m, $) => {
									t();
									var f = a('comment');
									e(m, f);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var qt = r(Ut, 2);
			R(qt, {
				id: 'bug-fixes-7',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var zt = r(qt, 2);
			B(zt, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = $s(),
								P = r(h(u));
							(d(P, {
								href: 'https://github.com/pocket-id/pocket-id/commit/d6d1a4ced23886f255a9c2048d19ad3599a17f26',
								children: (x, m) => {
									t();
									var $ = a('d6d1a4c');
									e(x, $);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Et = r(zt, 2);
			T(Et, {
				id: 'v190---2025-08-24',
				children: (s, b) => {
					t();
					var o = a('v1.9.0 - 2025-08-24');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Nt = r(Et, 2);
			O(Nt, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.9.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Gt = r(Nt, 2);
			R(Gt, {
				id: 'features-4',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var jt = r(Gt, 2);
			B(jt, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = is(),
								P = r(h(u));
							d(P, {
								href: 'https://github.com/pocket-id/pocket-id/issues/874',
								children: (m, $) => {
									t();
									var f = a('#874');
									e(m, f);
								},
								$$slots: { default: !0 }
							});
							var x = r(P, 2);
							(d(x, {
								href: 'https://github.com/pocket-id/pocket-id/commit/c114a2edaae4c007c75c34c02e8b0bb011845cae',
								children: (m, $) => {
									t();
									var f = a('c114a2e');
									e(m, f);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Ht = r(jt, 2);
			R(Ht, {
				id: 'bug-fixes-8',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Jt = r(Ht, 2);
			B(Jt, {
				children: (s, b) => {
					var o = ps(),
						k = h(o);
					g(k, {
						children: (x, m) => {
							t();
							var $ = cs(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/commit/2ffc6ba42af4742a13b77543142b66b3e826ab88',
								children: (i, l) => {
									t();
									var p = a('2ffc6ba');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (x, m) => {
							t();
							var $ = ns(),
								f = r(h($));
							d(f, {
								href: 'https://github.com/pocket-id/pocket-id/issues/876',
								children: (l, p) => {
									t();
									var c = a('#876');
									e(l, c);
								},
								$$slots: { default: !0 }
							});
							var i = r(f, 2);
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/1f3550c9bd3aafd3bd2272ef47f3ed8736037d81',
								children: (l, p) => {
									t();
									var c = a('1f3550c');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					(g(P, {
						children: (x, m) => {
							t();
							var $ = us(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/commit/d0392d25edcaa5f3c7da2aad70febf63b47763fa',
								children: (i, l) => {
									t();
									var p = a('d0392d2');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var Wt = r(Jt, 2);
			T(Wt, {
				id: 'v181---2025-08-24',
				children: (s, b) => {
					t();
					var o = a('v1.8.1 - 2025-08-24');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Mt = r(Wt, 2);
			O(Mt, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.8.1',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Xt = r(Mt, 2);
			R(Xt, {
				id: 'bug-fixes-9',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Yt = r(Xt, 2);
			B(Yt, {
				children: (s, b) => {
					var o = vs(),
						k = h(o);
					g(k, {
						children: (P, x) => {
							t();
							var m = fs(),
								$ = r(h(m));
							(d($, {
								href: 'https://github.com/pocket-id/pocket-id/commit/5971bfbfa66ecfebf2b1c08d34fcbd8c18cdc046',
								children: (f, i) => {
									t();
									var l = a('5971bfb');
									e(f, l);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(P, m));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					(g(u, {
						children: (P, x) => {
							t();
							var m = hs(),
								$ = r(h(m));
							d($, {
								href: 'https://github.com/pocket-id/pocket-id/issues/869',
								children: (i, l) => {
									t();
									var p = a('#869');
									e(i, p);
								},
								$$slots: { default: !0 }
							});
							var f = r($, 2);
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/commit/1283314f776a0ba43be7d796e7e2243e31f860de',
								children: (i, l) => {
									t();
									var p = a('1283314');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(P, m));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var Qt = r(Yt, 2);
			T(Qt, {
				id: 'v180---2025-08-23',
				children: (s, b) => {
					t();
					var o = a('v1.8.0 - 2025-08-23');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Kt = r(Qt, 2);
			O(Kt, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.8.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Vt = r(Kt, 2);
			R(Vt, {
				id: 'features-5',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Zt = r(Vt, 2);
			B(Zt, {
				children: (s, b) => {
					var o = ks(),
						k = h(o);
					g(k, {
						children: ($, f) => {
							t();
							var i = _s(),
								l = r(h(i));
							d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/747',
								children: (c, n) => {
									t();
									var _ = a('#747');
									e(c, _);
								},
								$$slots: { default: !0 }
							});
							var p = r(l, 2);
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/0cb039d35d49206011064e622f3bfd3d8f88720f',
								children: (c, n) => {
									t();
									var _ = a('0cb039d');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: ($, f) => {
							t();
							var i = ms(),
								l = r(h(i));
							d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/864',
								children: (c, n) => {
									t();
									var _ = a('#864');
									e(c, _);
								},
								$$slots: { default: !0 }
							});
							var p = r(l, 2);
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/a5efb9506582884c70b9b1fd737ebdd44b101b47',
								children: (c, n) => {
									t();
									var _ = a('a5efb95');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: ($, f) => {
							t();
							var i = bs(),
								l = r(h(i));
							d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/832',
								children: (c, n) => {
									t();
									var _ = a('#832');
									e(c, _);
								},
								$$slots: { default: !0 }
							});
							var p = r(l, 2);
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/3188e92257afcaf7a16dd418e4c40626d7e1d034',
								children: (c, n) => {
									t();
									var _ = a('3188e92');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					g(x, {
						children: ($, f) => {
							t();
							var i = gs(),
								l = r(h(i));
							d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/851',
								children: (c, n) => {
									t();
									var _ = a('#851');
									e(c, _);
								},
								$$slots: { default: !0 }
							});
							var p = r(l, 2);
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/d28bfac81fc24ee79e4896538a616f0a89ab30a5',
								children: (c, n) => {
									t();
									var _ = a('d28bfac');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var m = r(x, 2);
					(g(m, {
						children: ($, f) => {
							var i = Ps(),
								l = h(i);
							D(l, {
								children: (n, _) => {
									t();
									var y = a('signup:');
									e(n, y);
								},
								$$slots: { default: !0 }
							});
							var p = r(l, 2);
							d(p, {
								href: 'https://github.com/pocket-id/pocket-id/issues/812',
								children: (n, _) => {
									t();
									var y = a('#812');
									e(n, y);
								},
								$$slots: { default: !0 }
							});
							var c = r(p, 2);
							(d(c, {
								href: 'https://github.com/pocket-id/pocket-id/commit/182d8090286f9953171c6c410283be679889aca7',
								children: (n, _) => {
									t();
									var y = a('182d809');
									e(n, y);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var te = r(Zt, 2);
			R(te, {
				id: 'bug-fixes-10',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var ee = r(te, 2);
			B(ee, {
				children: (s, b) => {
					var o = Cs(),
						k = h(o);
					g(k, {
						children: (c, n) => {
							t();
							var _ = xs(),
								y = r(h(_));
							(d(y, {
								href: 'https://github.com/pocket-id/pocket-id/commit/0aab3f3c7ad8c1b14939de3ded60c9f201eab8fc',
								children: (w, F) => {
									t();
									var I = a('0aab3f3');
									e(w, I);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(c, _));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (c, n) => {
							t();
							var _ = ys(),
								y = r(h(_));
							(d(y, {
								href: 'https://github.com/pocket-id/pocket-id/commit/fe003b927ce7772692439992860c804de89ce424',
								children: (w, F) => {
									t();
									var I = a('fe003b9');
									e(w, I);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(c, _));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: (c, n) => {
							var _ = ws(),
								y = h(_);
							D(y, {
								children: (I, A) => {
									t();
									var L = a('deps:');
									e(I, L);
								},
								$$slots: { default: !0 }
							});
							var w = r(y, 2);
							d(w, {
								href: 'https://github.com/pocket-id/pocket-id/issues/845',
								children: (I, A) => {
									t();
									var L = a('#845');
									e(I, L);
								},
								$$slots: { default: !0 }
							});
							var F = r(w, 2);
							(d(F, {
								href: 'https://github.com/pocket-id/pocket-id/commit/b5e6371eaaf3d9e85d8b05c457487c4425fa8381',
								children: (I, A) => {
									t();
									var L = a('b5e6371');
									e(I, L);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(c, _));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					g(x, {
						children: (c, n) => {
							t();
							var _ = Fs(),
								y = r(h(_));
							d(y, {
								href: 'https://github.com/pocket-id/pocket-id/issues/863',
								children: (F, I) => {
									t();
									var A = a('#863');
									e(F, A);
								},
								$$slots: { default: !0 }
							});
							var w = r(y, 2);
							(d(w, {
								href: 'https://github.com/pocket-id/pocket-id/commit/625f23574001ebd7074b8d98d448a2811847be16',
								children: (F, I) => {
									t();
									var A = a('625f235');
									e(F, A);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(c, _));
						},
						$$slots: { default: !0 }
					});
					var m = r(x, 2);
					g(m, {
						children: (c, n) => {
							t();
							var _ = Is(),
								y = r(h(_));
							(d(y, {
								href: 'https://github.com/pocket-id/pocket-id/commit/24e274200fe4002d01c58cc3fa74094b598d7599',
								children: (w, F) => {
									t();
									var I = a('24e2742');
									e(w, I);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(c, _));
						},
						$$slots: { default: !0 }
					});
					var $ = r(m, 2);
					g($, {
						children: (c, n) => {
							t();
							var _ = Rs(),
								y = r(h(_));
							d(y, {
								href: 'https://github.com/pocket-id/pocket-id/issues/855',
								children: (F, I) => {
									t();
									var A = a('#855');
									e(F, A);
								},
								$$slots: { default: !0 }
							});
							var w = r(y, 2);
							(d(w, {
								href: 'https://github.com/pocket-id/pocket-id/commit/7ab0fd30286e6b67b5ce586484d82a20c42b471d',
								children: (F, I) => {
									t();
									var A = a('7ab0fd3');
									e(F, A);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(c, _));
						},
						$$slots: { default: !0 }
					});
					var f = r($, 2);
					g(f, {
						children: (c, n) => {
							t();
							var _ = Bs(),
								y = r(h(_));
							d(y, {
								href: 'https://github.com/pocket-id/pocket-id/issues/836',
								children: (F, I) => {
									t();
									var A = a('#836');
									e(F, A);
								},
								$$slots: { default: !0 }
							});
							var w = r(y, 2);
							(d(w, {
								href: 'https://github.com/pocket-id/pocket-id/commit/7b1f6b88572bac1f3e838a9e904917fbd5fbdf61',
								children: (F, I) => {
									t();
									var A = a('7b1f6b8');
									e(F, A);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(c, _));
						},
						$$slots: { default: !0 }
					});
					var i = r(f, 2);
					g(i, {
						children: (c, n) => {
							t();
							var _ = As(),
								y = r(h(_));
							d(y, {
								href: 'https://github.com/pocket-id/pocket-id/issues/854',
								children: (F, I) => {
									t();
									var A = a('#854');
									e(F, A);
								},
								$$slots: { default: !0 }
							});
							var w = r(y, 2);
							(d(w, {
								href: 'https://github.com/pocket-id/pocket-id/commit/9339e88a5a26ff77a5e40149cbb1a5b339b7ec6a',
								children: (F, I) => {
									t();
									var A = a('9339e88');
									e(F, A);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(c, _));
						},
						$$slots: { default: !0 }
					});
					var l = r(i, 2);
					g(l, {
						children: (c, n) => {
							t();
							var _ = Os(),
								y = r(h(_));
							(d(y, {
								href: 'https://github.com/pocket-id/pocket-id/commit/0e44f245afcdf8179bf619613ca9ef4bffa176ca',
								children: (w, F) => {
									t();
									var I = a('0e44f24');
									e(w, I);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(c, _));
						},
						$$slots: { default: !0 }
					});
					var p = r(l, 2);
					(g(p, {
						children: (c, n) => {
							t();
							var _ = Ts(),
								y = r(h(_));
							(d(y, {
								href: 'https://github.com/pocket-id/pocket-id/commit/fc0c99a232b0efb1a5b5d2c551102418b1080293',
								children: (w, F) => {
									t();
									var I = a('fc0c99a');
									e(w, I);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(c, _));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var re = r(ee, 2);
			R(re, {
				id: 'sponsors-2',
				children: (s, b) => {
					t();
					var o = a('Sponsors');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var oe = r(re, 2);
			O(oe, {
				children: (s, b) => {
					t();
					var o = a('Thanks Brandon Butler (@Starttoaster) for your support!');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var se = r(oe, 2);
			T(se, {
				id: 'v170---2025-08-10',
				children: (s, b) => {
					t();
					var o = a('v1.7.0 - 2025-08-10');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var ae = r(se, 2);
			O(ae, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.7.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var de = r(ae, 2);
			R(de, {
				id: 'features-6',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var le = r(de, 2);
			B(le, {
				children: (s, b) => {
					var o = zs(),
						k = h(o);
					g(k, {
						children: ($, f) => {
							t();
							var i = Ls(),
								l = r(h(i));
							d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/806',
								children: (c, n) => {
									t();
									var _ = a('#806');
									e(c, _);
								},
								$$slots: { default: !0 }
							});
							var p = r(l, 2);
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/06e1656923eb2f4531be497716f9147c09d60b65',
								children: (c, n) => {
									t();
									var _ = a('06e1656');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: ($, f) => {
							t();
							var i = Ds(),
								l = r(h(i));
							C(l, () => '<code>code_challenge_methods_supported</code>');
							var p = r(l, 2);
							d(p, {
								href: 'https://github.com/pocket-id/pocket-id/issues/794',
								children: (n, _) => {
									t();
									var y = a('#794');
									e(n, y);
								},
								$$slots: { default: !0 }
							});
							var c = r(p, 2);
							(d(c, {
								href: 'https://github.com/pocket-id/pocket-id/commit/d479817b6a7ca4807b5de500b3ba713d436b0770',
								children: (n, _) => {
									t();
									var y = a('d479817');
									e(n, y);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: ($, f) => {
							t();
							var i = Ss(),
								l = r(h(i));
							d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/760',
								children: (c, n) => {
									t();
									var _ = a('#760');
									e(c, _);
								},
								$$slots: { default: !0 }
							});
							var p = r(l, 2);
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/78266e3e4cab2b23249c3baf20f4387d00eebd9e',
								children: (c, n) => {
									t();
									var _ = a('78266e3');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					g(x, {
						children: ($, f) => {
							t();
							var i = Us(),
								l = r(h(i));
							d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/799',
								children: (c, n) => {
									t();
									var _ = a('#799');
									e(c, _);
								},
								$$slots: { default: !0 }
							});
							var p = r(l, 2);
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/0a3b1c653050f2237d30ec437c5de88baa704a25',
								children: (c, n) => {
									t();
									var _ = a('0a3b1c6');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var m = r(x, 2);
					(g(m, {
						children: ($, f) => {
							t();
							var i = qs(),
								l = r(h(i));
							d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/727',
								children: (c, n) => {
									t();
									var _ = a('#727');
									e(c, _);
								},
								$$slots: { default: !0 }
							});
							var p = r(l, 2);
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/484c2f6ef20efc1fade1a41e2aeace54c7bb4f1b',
								children: (c, n) => {
									t();
									var _ = a('484c2f6');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var $e = r(le, 2);
			R($e, {
				id: 'bug-fixes-11',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var ie = r($e, 2);
			B(ie, {
				children: (s, b) => {
					var o = Js(),
						k = h(o);
					g(k, {
						children: ($, f) => {
							t();
							var i = Es(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/commit/f0c144c51c635bc348222a00d3bc88bc4e0711ef',
								children: (p, c) => {
									t();
									var n = a('f0c144c');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: ($, f) => {
							t();
							var i = Ns(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/commit/9ac5d5118710cad59c8c4ce7cef7ab09be3de664',
								children: (p, c) => {
									t();
									var n = a('9ac5d51');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: ($, f) => {
							t();
							var i = Gs(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/commit/4d59e7286666480e20c728787a95e82513509240',
								children: (p, c) => {
									t();
									var n = a('4d59e72');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					g(x, {
						children: ($, f) => {
							t();
							var i = js(),
								l = r(h(i));
							d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/783',
								children: (c, n) => {
									t();
									var _ = a('#783');
									e(c, _);
								},
								$$slots: { default: !0 }
							});
							var p = r(l, 2);
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/c8478d75bed7295625cd3cf62ef46fcd95902410',
								children: (c, n) => {
									t();
									var _ = a('c8478d7');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var m = r(x, 2);
					(g(m, {
						children: ($, f) => {
							t();
							var i = Hs(),
								l = r(h(i));
							d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/776',
								children: (c, n) => {
									t();
									var _ = a('#776');
									e(c, _);
								},
								$$slots: { default: !0 }
							});
							var p = r(l, 2);
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/d541c9ab4af8d7283891a80f886dd5d4ebc52f53',
								children: (c, n) => {
									t();
									var _ = a('d541c9a');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var ce = r(ie, 2);
			T(ce, {
				id: 'v164---2025-07-21',
				children: (s, b) => {
					t();
					var o = a('v1.6.4 - 2025-07-21');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var ne = r(ce, 2);
			O(ne, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.6.4',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var ue = r(ne, 2);
			R(ue, {
				id: 'bug-fixes-12',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var pe = r(ue, 2);
			B(pe, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = Ws(),
								P = r(h(u));
							d(P, {
								href: 'https://github.com/pocket-id/pocket-id/issues/762',
								children: (m, $) => {
									t();
									var f = a('#762');
									e(m, f);
								},
								$$slots: { default: !0 }
							});
							var x = r(P, 2);
							(d(x, {
								href: 'https://github.com/pocket-id/pocket-id/commit/35d5f887ce7c88933d7e4c2f0acd2aeedd18c214',
								children: (m, $) => {
									t();
									var f = a('35d5f88');
									e(m, f);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var fe = r(pe, 2);
			T(fe, {
				id: 'v163---2025-07-21',
				children: (s, b) => {
					t();
					var o = a('v1.6.3 - 2025-07-21');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var he = r(fe, 2);
			O(he, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.6.3',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var ve = r(he, 2);
			R(ve, {
				id: 'bug-fixes-13',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var _e = r(ve, 2);
			B(_e, {
				children: (s, b) => {
					var o = Vs(),
						k = h(o);
					g(k, {
						children: ($, f) => {
							t();
							var i = Ms(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/commit/b03e91b6530c2393ad20ac49aa2cb2b4962651b2',
								children: (p, c) => {
									t();
									var n = a('b03e91b');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: ($, f) => {
							t();
							var i = Xs(),
								l = r(h(i));
							d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/724',
								children: (c, n) => {
									t();
									var _ = a('#724');
									e(c, _);
								},
								$$slots: { default: !0 }
							});
							var p = r(l, 2);
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/7b4ccd1f306f4882c52fe30133fcda114ef0d18b',
								children: (c, n) => {
									t();
									var _ = a('7b4ccd1');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: ($, f) => {
							t();
							var i = Ys(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/commit/2952b1575542ecd0062fe740e2d6a3caad05190d',
								children: (p, c) => {
									t();
									var n = a('2952b15');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					g(x, {
						children: ($, f) => {
							t();
							var i = Qs(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/commit/d3bc1797b65ec8bc9201c55d06f3612093f3a873',
								children: (p, c) => {
									t();
									var n = a('d3bc179');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var m = r(x, 2);
					(g(m, {
						children: ($, f) => {
							t();
							var i = Ks(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/commit/ef1d5996624fc534190f80a26f2c48bbad206f49',
								children: (p, c) => {
									t();
									var n = a('ef1d599');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var me = r(_e, 2);
			T(me, {
				id: 'v162---2025-07-09',
				children: (s, b) => {
					t();
					var o = a('v1.6.2 - 2025-07-09');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var be = r(me, 2);
			O(be, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.6.2',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var ge = r(be, 2);
			R(ge, {
				id: 'bug-fixes-14',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Pe = r(ge, 2);
			B(Pe, {
				children: (s, b) => {
					var o = ea(),
						k = h(o);
					g(k, {
						children: (P, x) => {
							t();
							var m = Zs(),
								$ = r(h(m));
							(d($, {
								href: 'https://github.com/pocket-id/pocket-id/commit/f103a547904070c5b192e519c8b5a8fed9d80e96',
								children: (f, i) => {
									t();
									var l = a('f103a54');
									e(f, l);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(P, m));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					(g(u, {
						children: (P, x) => {
							t();
							var m = ta(),
								$ = r(h(m));
							d($, {
								href: 'https://github.com/pocket-id/pocket-id/issues/737',
								children: (i, l) => {
									t();
									var p = a('#737');
									e(i, p);
								},
								$$slots: { default: !0 }
							});
							var f = r($, 2);
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/commit/e1de593dcd30b7b04da3b003455134992b702595',
								children: (i, l) => {
									t();
									var p = a('e1de593');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(P, m));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var ke = r(Pe, 2);
			T(ke, {
				id: 'v161---2025-07-06',
				children: (s, b) => {
					t();
					var o = a('v1.6.1 - 2025-07-06');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var xe = r(ke, 2);
			O(xe, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.6.1',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var ye = r(xe, 2);
			S(ye, {
				children: (s, b) => {
					O(s, {
						children: (o, k) => {
							t();
							var u = ra(),
								P = r(h(u), 3);
							C(P, () => '<code>v1.6.0</code>');
							var x = r(P, 2);
							(C(x, () => '<code>latest</code>'), t(), e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var we = r(ye, 2);
			T(we, {
				id: 'v160---2025-07-06',
				children: (s, b) => {
					t();
					var o = a('v1.6.0 - 2025-07-06');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Fe = r(we, 2);
			O(Fe, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.6.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Ie = r(Fe, 2);
			R(Ie, {
				id: 'features-7',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Re = r(Ie, 2);
			B(Re, {
				children: (s, b) => {
					var o = $a(),
						k = h(o);
					g(k, {
						children: ($, f) => {
							t();
							var i = oa(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/commit/bf042563e997d57bb087705a5789fd72ffbed467',
								children: (p, c) => {
									t();
									var n = a('bf04256');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: ($, f) => {
							t();
							var i = sa(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/716',
								children: (p, c) => {
									t();
									var n = a('#716');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: ($, f) => {
							t();
							var i = aa(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/682',
								children: (p, c) => {
									t();
									var n = a('#682');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					g(x, {
						children: ($, f) => {
							t();
							var i = da(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/commit/be526602273c1689cb4057ca96d4214e7f817d1d',
								children: (p, c) => {
									t();
									var n = a('be52660');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var m = r(x, 2);
					(g(m, {
						children: ($, f) => {
							t();
							var i = la(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/709',
								children: (p, c) => {
									t();
									var n = a('#709');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var Be = r(Re, 2);
			R(Be, {
				id: 'bug-fixes-15',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Ae = r(Be, 2);
			B(Ae, {
				children: (s, b) => {
					var o = _a(),
						k = h(o);
					g(k, {
						children: (l, p) => {
							t();
							var c = ia(),
								n = r(h(c));
							(d(n, {
								href: 'https://github.com/pocket-id/pocket-id/commit/9872608d61a486f7b775f314d9392e0620bcd891',
								children: (_, y) => {
									t();
									var w = a('9872608');
									e(_, w);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (l, p) => {
							t();
							var c = ca(),
								n = r(h(c));
							(d(n, {
								href: 'https://github.com/pocket-id/pocket-id/issues/696',
								children: (_, y) => {
									t();
									var w = a('#696');
									e(_, w);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: (l, p) => {
							t();
							var c = na(),
								n = r(h(c));
							(d(n, {
								href: 'https://github.com/pocket-id/pocket-id/issues/695',
								children: (_, y) => {
									t();
									var w = a('#695');
									e(_, w);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					g(x, {
						children: (l, p) => {
							t();
							var c = ua(),
								n = r(h(c));
							(d(n, {
								href: 'https://github.com/pocket-id/pocket-id/commit/49f1ab2f75df97d551fff5acbadcd55df74af617',
								children: (_, y) => {
									t();
									var w = a('49f1ab2');
									e(_, w);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					});
					var m = r(x, 2);
					g(m, {
						children: (l, p) => {
							t();
							var c = pa(),
								n = r(h(c));
							(d(n, {
								href: 'https://github.com/pocket-id/pocket-id/commit/e46f60ac8d6944bcea54d0708af1950d98f66c3c',
								children: (_, y) => {
									t();
									var w = a('e46f60a');
									e(_, w);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					});
					var $ = r(m, 2);
					g($, {
						children: (l, p) => {
							t();
							var c = fa(),
								n = r(h(c));
							(d(n, {
								href: 'https://github.com/pocket-id/pocket-id/commit/5c9e504291b3bffe947bcbe907701806e301d1fe',
								children: (_, y) => {
									t();
									var w = a('5c9e504');
									e(_, w);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					});
					var f = r($, 2);
					g(f, {
						children: (l, p) => {
							t();
							var c = ha(),
								n = r(h(c));
							(d(n, {
								href: 'https://github.com/pocket-id/pocket-id/issues/714',
								children: (_, y) => {
									t();
									var w = a('#714');
									e(_, w);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					});
					var i = r(f, 2);
					(g(i, {
						children: (l, p) => {
							t();
							var c = va(),
								n = r(h(c));
							(d(n, {
								href: 'https://github.com/pocket-id/pocket-id/issues/704',
								children: (_, y) => {
									t();
									var w = a('#704');
									e(_, w);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(l, c));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var Oe = r(Ae, 2);
			T(Oe, {
				id: 'v150---2025-06-27',
				children: (s, b) => {
					t();
					var o = a('v1.5.0 - 2025-06-27');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Te = r(Oe, 2);
			O(Te, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.5.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Ce = r(Te, 2);
			R(Ce, {
				id: 'features-8',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Le = r(Ce, 2);
			B(Le, {
				children: (s, b) => {
					var o = Pa(),
						k = h(o);
					g(k, {
						children: (x, m) => {
							t();
							var $ = ma(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/issues/672',
								children: (i, l) => {
									t();
									var p = a('#672');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (x, m) => {
							t();
							var $ = ba(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/commit/287314f01644e42ddb2ce1b1115bd14f2f0c1768',
								children: (i, l) => {
									t();
									var p = a('287314f');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					(g(P, {
						children: (x, m) => {
							t();
							var $ = ga(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/commit/ba61cdba4eb3d5659f3ae6b6c21249985c0aa630',
								children: (i, l) => {
									t();
									var p = a('ba61cdb');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var De = r(Le, 2);
			R(De, {
				id: 'bug-fixes-16',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Se = r(De, 2);
			B(Se, {
				children: (s, b) => {
					var o = Ra(),
						k = h(o);
					g(k, {
						children: (f, i) => {
							t();
							var l = ka(),
								p = r(h(l));
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/1a77bd9914ea01e445ff3d6e116c9ed3bcfbf153',
								children: (c, n) => {
									t();
									var _ = a('1a77bd9');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(f, l));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (f, i) => {
							t();
							var l = xa(),
								p = r(h(l));
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/d976bf5965eda10e3ecb71821c23e93e5d712a02',
								children: (c, n) => {
									t();
									var _ = a('d976bf5');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(f, l));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: (f, i) => {
							t();
							var l = ya(),
								p = r(h(l));
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/issues/681',
								children: (c, n) => {
									t();
									var _ = a('#681');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(f, l));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					g(x, {
						children: (f, i) => {
							t();
							var l = wa(),
								p = r(h(l));
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/052ac008c3a8c910d1ce79ee99b2b2f75e4090f4',
								children: (c, n) => {
									t();
									var _ = a('052ac00');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(f, l));
						},
						$$slots: { default: !0 }
					});
					var m = r(x, 2);
					g(m, {
						children: (f, i) => {
							t();
							var l = Fa(),
								p = r(h(l));
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/issues/678',
								children: (c, n) => {
									t();
									var _ = a('#678');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(f, l));
						},
						$$slots: { default: !0 }
					});
					var $ = r(m, 2);
					(g($, {
						children: (f, i) => {
							t();
							var l = Ia(),
								p = r(h(l));
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/29cb5513a03d1a9571969c8a42deec9b2bdee037',
								children: (c, n) => {
									t();
									var _ = a('29cb551');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(f, l));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var Ue = r(Se, 2);
			T(Ue, {
				id: 'v141---2025-06-22',
				children: (s, b) => {
					t();
					var o = a('v1.4.1 - 2025-06-22');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var qe = r(Ue, 2);
			O(qe, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.4.1',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var ze = r(qe, 2);
			R(ze, {
				id: 'bug-fixes-17',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Ee = r(ze, 2);
			B(Ee, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = Ba(),
								P = r(h(u));
							(d(P, {
								href: 'https://github.com/pocket-id/pocket-id/commit/7d36bda769e25497dec6b76206a4f7e151b0bd72',
								children: (x, m) => {
									t();
									var $ = a('7d36bda');
									e(x, $);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Ne = r(Ee, 2);
			T(Ne, {
				id: 'v140---2025-06-19',
				children: (s, b) => {
					t();
					var o = a('v1.4.0 - 2025-06-19');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Ge = r(Ne, 2);
			O(Ge, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.4.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var je = r(Ge, 2);
			R(je, {
				id: 'features-9',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var He = r(je, 2);
			B(He, {
				children: (s, b) => {
					var o = Sa(),
						k = h(o);
					g(k, {
						children: (f, i) => {
							t();
							var l = Aa(),
								p = r(h(l));
							d(p, {
								href: 'https://github.com/pocket-id/pocket-id/issues/661',
								children: (n, _) => {
									t();
									var y = a('#661');
									e(n, y);
								},
								$$slots: { default: !0 }
							});
							var c = r(p, 2);
							(d(c, {
								href: 'https://github.com/pocket-id/pocket-id/commit/7677a3de2c923c11a58bc8c4d1b2121d403a1504',
								children: (n, _) => {
									t();
									var y = a('7677a3d');
									e(n, y);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(f, l));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (f, i) => {
							t();
							var l = Oa(),
								p = r(h(l));
							d(p, {
								href: 'https://github.com/pocket-id/pocket-id/issues/647',
								children: (n, _) => {
									t();
									var y = a('#647');
									e(n, y);
								},
								$$slots: { default: !0 }
							});
							var c = r(p, 2);
							(d(c, {
								href: 'https://github.com/pocket-id/pocket-id/commit/d6795300b158b85dd9feadd561b6ecd891f5db0d',
								children: (n, _) => {
									t();
									var y = a('d679530');
									e(n, y);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(f, l));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: (f, i) => {
							t();
							var l = Ta(),
								p = r(h(l));
							d(p, {
								href: 'https://github.com/pocket-id/pocket-id/issues/657',
								children: (n, _) => {
									t();
									var y = a('#657');
									e(n, y);
								},
								$$slots: { default: !0 }
							});
							var c = r(p, 2);
							(d(c, {
								href: 'https://github.com/pocket-id/pocket-id/commit/d5485238b8fd4cc566af00eae2b17d69a119f991',
								children: (n, _) => {
									t();
									var y = a('d548523');
									e(n, y);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(f, l));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					g(x, {
						children: (f, i) => {
							t();
							var l = Ca(),
								p = r(h(l));
							d(p, {
								href: 'https://github.com/pocket-id/pocket-id/issues/662',
								children: (n, _) => {
									t();
									var y = a('#662');
									e(n, y);
								},
								$$slots: { default: !0 }
							});
							var c = r(p, 2);
							(d(c, {
								href: 'https://github.com/pocket-id/pocket-id/commit/ac5a121f664b8127d0faf30c0f93432f30e7f33a',
								children: (n, _) => {
									t();
									var y = a('ac5a121');
									e(n, y);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(f, l));
						},
						$$slots: { default: !0 }
					});
					var m = r(x, 2);
					g(m, {
						children: (f, i) => {
							t();
							var l = La(),
								p = r(h(l));
							d(p, {
								href: 'https://github.com/pocket-id/pocket-id/issues/643',
								children: (n, _) => {
									t();
									var y = a('#643');
									e(n, y);
								},
								$$slots: { default: !0 }
							});
							var c = r(p, 2);
							(d(c, {
								href: 'https://github.com/pocket-id/pocket-id/commit/883877adec6fc3e65bd5a705499449959b894fb5',
								children: (n, _) => {
									t();
									var y = a('883877a');
									e(n, y);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(f, l));
						},
						$$slots: { default: !0 }
					});
					var $ = r(m, 2);
					(g($, {
						children: (f, i) => {
							t();
							var l = Da(),
								p = r(h(l));
							(d(p, {
								href: 'https://github.com/pocket-id/pocket-id/commit/215531d65c6683609b0b4a5505fdb72696fdb93e',
								children: (c, n) => {
									t();
									var _ = a('215531d');
									e(c, _);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(f, l));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var Je = r(He, 2);
			R(Je, {
				id: 'bug-fixes-18',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var We = r(Je, 2);
			B(We, {
				children: (s, b) => {
					var o = Na(),
						k = h(o);
					g(k, {
						children: (m, $) => {
							t();
							var f = Ua(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/1bcb50edc335886dd722a4c69960c48cc3cd1687',
								children: (l, p) => {
									t();
									var c = a('1bcb50e');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (m, $) => {
							t();
							var f = qa(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/946c534b0877a074a6b658060f9af27e4061397c',
								children: (l, p) => {
									t();
									var c = a('946c534');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: (m, $) => {
							t();
							var f = za(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/2e5d2687982186c12e530492292d49895cb6043a',
								children: (l, p) => {
									t();
									var c = a('2e5d268');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					(g(x, {
						children: (m, $) => {
							t();
							var f = Ea(),
								i = r(h(f));
							d(i, {
								href: 'https://github.com/pocket-id/pocket-id/issues/648',
								children: (p, c) => {
									t();
									var n = a('#648');
									e(p, n);
								},
								$$slots: { default: !0 }
							});
							var l = r(i, 2);
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/commit/d77044882d5a41da22df1c0099c1eb1f20bcbc5b',
								children: (p, c) => {
									t();
									var n = a('d770448');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var Me = r(We, 2);
			T(Me, {
				id: 'v131---2025-06-09',
				children: (s, b) => {
					t();
					var o = a('v1.3.1 - 2025-06-09');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Xe = r(Me, 2);
			O(Xe, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.3.1',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Ye = r(Xe, 2);
			R(Ye, {
				id: 'bug-fixes-19',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Qe = r(Ye, 2);
			B(Qe, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = Ga(),
								P = r(h(u));
							C(P, () => '<code>client_credentials.sql</code>');
							var x = r(P, 2);
							(d(x, {
								href: 'https://github.com/pocket-id/pocket-id/commit/2935236acee9c78c2fe6787ec8b5f53ae0eca047',
								children: (m, $) => {
									t();
									var f = a('2935236');
									e(m, f);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Ke = r(Qe, 2);
			T(Ke, {
				id: 'v130---2025-06-09',
				children: (s, b) => {
					t();
					var o = a('v1.3.0 - 2025-06-09');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Ve = r(Ke, 2);
			O(Ve, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.3.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Ze = r(Ve, 2);
			R(Ze, {
				id: 'features-10',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var tr = r(Ze, 2);
			B(tr, {
				children: (s, b) => {
					var o = Xa(),
						k = h(o);
					g(k, {
						children: ($, f) => {
							t();
							var i = ja(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/commit/d217083059120171d5c555b09eefe6ba3c8a8d42',
								children: (p, c) => {
									t();
									var n = a('d217083');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: ($, f) => {
							t();
							var i = Ha(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/615',
								children: (p, c) => {
									t();
									var n = a('#615');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: ($, f) => {
							t();
							var i = Ja(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/566',
								children: (p, c) => {
									t();
									var n = a('#566');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					g(x, {
						children: ($, f) => {
							t();
							var i = Wa(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/commit/97f7326da40265a954340d519661969530f097a0',
								children: (p, c) => {
									t();
									var n = a('97f7326');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var m = r(x, 2);
					(g(m, {
						children: ($, f) => {
							t();
							var i = Ma(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/624',
								children: (p, c) => {
									t();
									var n = a('#624');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var er = r(tr, 2);
			R(er, {
				id: 'bug-fixes-20',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var rr = r(er, 2);
			B(rr, {
				children: (s, b) => {
					var o = Za(),
						k = h(o);
					g(k, {
						children: (m, $) => {
							t();
							var f = Ya(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/bdcef60cab6a61e1717661e918c42e3650d23fee',
								children: (l, p) => {
									t();
									var c = a('bdcef60');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (m, $) => {
							t();
							var f = Qa(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/657a51f7ed8a77e8a937971032091058aacfded6',
								children: (l, p) => {
									t();
									var c = a('657a51f');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: (m, $) => {
							t();
							var f = Ka(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/61b62d461200c1359a16c92c9c62530362a4785c',
								children: (l, p) => {
									t();
									var c = a('61b62d4');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					(g(x, {
						children: (m, $) => {
							t();
							var f = Va(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/5e9096e328741ba2a0e03835927fe62e6aea2a89',
								children: (l, p) => {
									t();
									var c = a('5e9096e');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var or = r(rr, 2);
			T(or, {
				id: 'v120---2025-06-03',
				children: (s, b) => {
					t();
					var o = a('v1.2.0 - 2025-06-03');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var sr = r(or, 2);
			O(sr, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.2.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var ar = r(sr, 2);
			R(ar, {
				id: 'features-11',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var dr = r(ar, 2);
			B(dr, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = td(),
								P = r(h(u));
							(d(P, {
								href: 'https://github.com/pocket-id/pocket-id/issues/583',
								children: (x, m) => {
									t();
									var $ = a('#583');
									e(x, $);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var lr = r(dr, 2);
			R(lr, {
				id: 'bug-fixes-21',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var $r = r(lr, 2);
			B($r, {
				children: (s, b) => {
					var o = cd(),
						k = h(o);
					g(k, {
						children: (p, c) => {
							t();
							var n = ed(),
								_ = r(h(n));
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/commit/6c00aaa3efa75c76d340718698a0f4556e8de268',
								children: (y, w) => {
									t();
									var F = a('6c00aaa');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (p, c) => {
							t();
							var n = rd(),
								_ = r(h(n));
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/commit/decf8ec70b5f6a69fe201d6e4ad60ee62e374ad0',
								children: (y, w) => {
									t();
									var F = a('decf8ec');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: (p, c) => {
							t();
							var n = od(),
								_ = r(h(n));
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/commit/2440379cd11b4a6da7c52b122ba8f49d7c72ce1d',
								children: (y, w) => {
									t();
									var F = a('2440379');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					g(x, {
						children: (p, c) => {
							t();
							var n = sd(),
								_ = r(h(n));
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/commit/04fcf1110e97b42dc5f0c20e169c569075d1e797',
								children: (y, w) => {
									t();
									var F = a('04fcf11');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var m = r(x, 2);
					g(m, {
						children: (p, c) => {
							t();
							var n = ad(),
								_ = r(h(n));
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/commit/31ad904367e53dd47a15abcce5402dfe84828a14',
								children: (y, w) => {
									t();
									var F = a('31ad904');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var $ = r(m, 2);
					g($, {
						children: (p, c) => {
							t();
							var n = dd(),
								_ = r(h(n));
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/issues/585',
								children: (y, w) => {
									t();
									var F = a('#585');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var f = r($, 2);
					g(f, {
						children: (p, c) => {
							t();
							var n = ld(),
								_ = r(h(n));
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/commit/b8746818240fde052e6f3b5db5c3355d7bbfcbda',
								children: (y, w) => {
									t();
									var F = a('b874681');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var i = r(f, 2);
					g(i, {
						children: (p, c) => {
							t();
							var n = $d(),
								_ = r(h(n));
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/issues/582',
								children: (y, w) => {
									t();
									var F = a('#582');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					});
					var l = r(i, 2);
					(g(l, {
						children: (p, c) => {
							t();
							var n = id(),
								_ = r(h(n));
							(d(_, {
								href: 'https://github.com/pocket-id/pocket-id/commit/b9489b5e9a32a2a3f54d48705e731a7bcf188d20',
								children: (y, w) => {
									t();
									var F = a('b9489b5');
									e(y, F);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(p, n));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var ir = r($r, 2);
			T(ir, {
				id: 'v110---2025-05-28',
				children: (s, b) => {
					t();
					var o = a('v1.1.0 - 2025-05-28');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var cr = r(ir, 2);
			O(cr, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.1.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var nr = r(cr, 2);
			S(nr, {
				children: (s, b) => {
					O(s, {
						children: (o, k) => {
							t();
							var u = nd(),
								P = r(h(u), 3);
							d(P, {
								href: 'https://github.com/pocket-id/analytics',
								children: (f, i) => {
									t();
									var l = a('Opendrive analytics server');
									e(f, l);
								},
								$$slots: { default: !0 }
							});
							var x = r(P, 2);
							C(x, () => '<code>ANALYTICS_DISABLED</code>');
							var m = r(x, 2);
							C(m, () => '<code>true</code>');
							var $ = r(m, 2);
							(d($, {
								href: 'https://pocket-id.org/docs/configuration/analytics',
								children: (f, i) => {
									t();
									var l = a('docs page');
									e(f, l);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var ur = r(nr, 2);
			R(ur, {
				id: 'features-12',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var pr = r(ur, 2);
			B(pr, {
				children: (s, b) => {
					var o = hd(),
						k = h(o);
					g(k, {
						children: (x, m) => {
							t();
							var $ = ud(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/issues/578',
								children: (i, l) => {
									t();
									var p = a('#578');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (x, m) => {
							t();
							var $ = pd(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/commit/68e4b67bd212e31ecc20277bfd293c94bf7f3642',
								children: (i, l) => {
									t();
									var p = a('68e4b67');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					(g(P, {
						children: (x, m) => {
							t();
							var $ = fd(),
								f = r(h($));
							d(f, {
								href: 'https://github.com/pocket-id/pocket-id/issues/567',
								children: (l, p) => {
									t();
									var c = a('#567');
									e(l, c);
								},
								$$slots: { default: !0 }
							});
							var i = r(f, 2);
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/38d7ee4432e0dacc2cfbabad4bfd9336b8b84079',
								children: (l, p) => {
									t();
									var c = a('38d7ee4');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var fr = r(pr, 2);
			R(fr, {
				id: 'bug-fixes-22',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var hr = r(fr, 2);
			B(hr, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = vd(),
								P = r(h(u));
							(d(P, {
								href: 'https://github.com/pocket-id/pocket-id/issues/565',
								children: (x, m) => {
									t();
									var $ = a('#565');
									e(x, $);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var vr = r(hr, 2);
			T(vr, {
				id: 'v100---2025-05-24',
				children: (s, b) => {
					t();
					var o = a('v1.0.0 - 2025-05-24');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var _r = r(vr, 2);
			O(_r, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v1.0.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var mr = r(_r, 2);
			S(mr, {
				children: (s, b) => {
					O(s, {
						children: (o, k) => {
							t();
							var u = _d(),
								P = r(h(u), 3);
							(d(P, {
								href: 'https://pocket-id.org/docs/setup/migrate-to-v1/',
								children: (x, m) => {
									t();
									var $ = a('migration guide');
									e(x, $);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var br = r(mr, 2);
			R(br, {
				id: 'features-13',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var gr = r(br, 2);
			B(gr, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = a('serve the static frontend trough the backend (#520)');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Pr = r(gr, 2);
			R(Pr, {
				id: 'bug-fixes-23',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var kr = r(Pr, 2);
			B(kr, {
				children: (s, b) => {
					var o = kd(),
						k = h(o);
					g(k, {
						children: (m, $) => {
							t();
							var f = md(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/c726c1621b8bd88b20cb05263f6d10888f0af8e2',
								children: (l, p) => {
									t();
									var c = a('c726c16');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (m, $) => {
							t();
							var f = bd(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/bf710aec5625c9dcb43c83d920318a036a135bae',
								children: (l, p) => {
									t();
									var c = a('bf710ae');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: (m, $) => {
							t();
							var f = gd(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/131f470757044fddd0989a76e9dc9e310f19819c',
								children: (l, p) => {
									t();
									var c = a('131f470');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					(g(x, {
						children: (m, $) => {
							t();
							var f = Pd(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/059073d4c24e34c142dddd4c150c384779fb51a9',
								children: (l, p) => {
									t();
									var c = a('059073d');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var xr = r(kr, 2);
			T(xr, {
				id: 'v0530---2025-05-08',
				children: (s, b) => {
					t();
					var o = a('v0.53.0 - 2025-05-08');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var yr = r(xr, 2);
			O(yr, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v0.53.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var wr = r(yr, 2);
			R(wr, {
				id: 'features-14',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Fr = r(wr, 2);
			B(Fr, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = xd(),
								P = r(h(u));
							C(P, () => '<code>TZ</code>');
							var x = r(P, 2);
							(d(x, {
								href: 'https://github.com/pocket-id/pocket-id/commit/5e2e947fe09fa881a7bbc70133a243a4baf30e90',
								children: (m, $) => {
									t();
									var f = a('5e2e947');
									e(m, f);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Ir = r(Fr, 2);
			R(Ir, {
				id: 'bug-fixes-24',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Rr = r(Ir, 2);
			B(Rr, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = yd(),
								P = r(h(u));
							(d(P, {
								href: 'https://github.com/pocket-id/pocket-id/issues/513',
								children: (x, m) => {
									t();
									var $ = a('#513');
									e(x, $);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Br = r(Rr, 2);
			T(Br, {
				id: 'v0520---2025-05-06',
				children: (s, b) => {
					t();
					var o = a('v0.52.0 - 2025-05-06');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Ar = r(Br, 2);
			O(Ar, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v0.52.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Or = r(Ar, 2);
			R(Or, {
				id: 'features-15',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Tr = r(Or, 2);
			B(Tr, {
				children: (s, b) => {
					var o = Id(),
						k = h(o);
					g(k, {
						children: (P, x) => {
							t();
							var m = wd(),
								$ = r(h(m));
							(d($, {
								href: 'https://github.com/pocket-id/pocket-id/issues/494',
								children: (f, i) => {
									t();
									var l = a('#494');
									e(f, l);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(P, m));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					(g(u, {
						children: (P, x) => {
							t();
							var m = Fd(),
								$ = r(h(m));
							(d($, {
								href: 'https://github.com/pocket-id/pocket-id/issues/495',
								children: (f, i) => {
									t();
									var l = a('#495');
									e(f, l);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(P, m));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var Cr = r(Tr, 2);
			R(Cr, {
				id: 'bug-fixes-25',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Lr = r(Cr, 2);
			B(Lr, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = Rd(),
								P = r(h(u));
							(d(P, {
								href: 'https://github.com/pocket-id/pocket-id/commit/c55fef057cdcec867af91b29968541983cd80ec0',
								children: (x, m) => {
									t();
									var $ = a('c55fef0');
									e(x, $);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Dr = r(Lr, 2);
			T(Dr, {
				id: 'v0511---2025-05-03',
				children: (s, b) => {
					t();
					var o = a('v0.51.1 - 2025-05-03');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Sr = r(Dr, 2);
			O(Sr, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v0.51.1',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Ur = r(Sr, 2);
			R(Ur, {
				id: 'bug-fixes-26',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var qr = r(Ur, 2);
			B(qr, {
				children: (s, b) => {
					var o = Td(),
						k = h(o);
					g(k, {
						children: (x, m) => {
							t();
							var $ = Bd(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/commit/0b9cbf47e36a332cfd854aa92e761264fb3e4795',
								children: (i, l) => {
									t();
									var p = a('0b9cbf4');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (x, m) => {
							t();
							var $ = Ad(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/issues/492',
								children: (i, l) => {
									t();
									var p = a('#492');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					(g(P, {
						children: (x, m) => {
							t();
							var $ = Od(),
								f = r(h($));
							(d(f, {
								href: 'https://github.com/pocket-id/pocket-id/commit/6bd6cefaa6dc571a319a6a1c2b2facc2404eadd3',
								children: (i, l) => {
									t();
									var p = a('6bd6cef');
									e(i, p);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(x, $));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var zr = r(qr, 2);
			T(zr, {
				id: 'v0510---2025-04-28',
				children: (s, b) => {
					t();
					var o = a('v0.51.0 - 2025-04-28');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Er = r(zr, 2);
			O(Er, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v0.51.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Nr = r(Er, 2);
			R(Nr, {
				id: 'features-16',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Gr = r(Nr, 2);
			B(Gr, {
				children: (s, b) => {
					g(s, {
						children: (o, k) => {
							t();
							var u = Cd(),
								P = r(h(u));
							(d(P, {
								href: 'https://github.com/pocket-id/pocket-id/issues/452',
								children: (x, m) => {
									t();
									var $ = a('#452');
									e(x, $);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(o, u));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var jr = r(Gr, 2);
			R(jr, {
				id: 'bug-fixes-27',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Hr = r(jr, 2);
			B(Hr, {
				children: (s, b) => {
					var o = qd(),
						k = h(o);
					g(k, {
						children: (m, $) => {
							t();
							var f = Ld(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/ce24372c571cc3b277095dc6a4107663d64f45b3',
								children: (l, p) => {
									t();
									var c = a('ce24372');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: (m, $) => {
							t();
							var f = Dd(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/1efd1d182dbb6190d3c7e27034426c9e48781b4a',
								children: (l, p) => {
									t();
									var c = a('1efd1d1');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: (m, $) => {
							t();
							var f = Sd(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/86d2b5f59f26cb944017826cbd8df915cdc986f1',
								children: (l, p) => {
									t();
									var c = a('86d2b5f');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					(g(x, {
						children: (m, $) => {
							t();
							var f = Ud(),
								i = r(h(f));
							(d(i, {
								href: 'https://github.com/pocket-id/pocket-id/commit/0a24ab80010eb5a15d99915802c6698274a5c57c',
								children: (l, p) => {
									t();
									var c = a('0a24ab8');
									e(l, c);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(m, f));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var Jr = r(Hr, 2);
			T(Jr, {
				id: 'v0500---2025-04-27',
				children: (s, b) => {
					t();
					var o = a('v0.50.0 - 2025-04-27');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Wr = r(Jr, 2);
			O(Wr, {
				children: (s, b) => {
					d(s, {
						href: 'https://github.com/pocket-id/pocket-id/releases/tag/v0.50.0',
						children: (o, k) => {
							t();
							var u = a('Release');
							e(o, u);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Mr = r(Wr, 2);
			R(Mr, {
				id: 'features-17',
				children: (s, b) => {
					t();
					var o = a('Features');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Xr = r(Mr, 2);
			B(Xr, {
				children: (s, b) => {
					var o = Nd(),
						k = h(o);
					g(k, {
						children: (P, x) => {
							t();
							var m = zd(),
								$ = r(h(m));
							(d($, {
								href: 'https://github.com/pocket-id/pocket-id/issues/270',
								children: (f, i) => {
									t();
									var l = a('#270');
									e(f, l);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(P, m));
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					(g(u, {
						children: (P, x) => {
							t();
							var m = Ed(),
								$ = r(h(m));
							(d($, {
								href: 'https://github.com/pocket-id/pocket-id/issues/476',
								children: (f, i) => {
									t();
									var l = a('#476');
									e(f, l);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e(P, m));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			});
			var Yr = r(Xr, 2);
			R(Yr, {
				id: 'bug-fixes-28',
				children: (s, b) => {
					t();
					var o = a('Bug Fixes');
					e(s, o);
				},
				$$slots: { default: !0 }
			});
			var Vr = r(Yr, 2);
			(B(Vr, {
				children: (s, b) => {
					var o = Wd(),
						k = h(o);
					g(k, {
						children: ($, f) => {
							t();
							var i = a(
								'incorrectly swapped refreshToken and accessToken (#490 by @j-baker)'
							);
							e($, i);
						},
						$$slots: { default: !0 }
					});
					var u = r(k, 2);
					g(u, {
						children: ($, f) => {
							t();
							var i = Gd(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/472',
								children: (p, c) => {
									t();
									var n = a('#472');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var P = r(u, 2);
					g(P, {
						children: ($, f) => {
							t();
							var i = jd(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/487',
								children: (p, c) => {
									t();
									var n = a('#487');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var x = r(P, 2);
					g(x, {
						children: ($, f) => {
							t();
							var i = Hd(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/471',
								children: (p, c) => {
									t();
									var n = a('#471');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					});
					var m = r(x, 2);
					(g(m, {
						children: ($, f) => {
							t();
							var i = Jd(),
								l = r(h(i));
							(d(l, {
								href: 'https://github.com/pocket-id/pocket-id/issues/470',
								children: (p, c) => {
									t();
									var n = a('#470');
									e(p, n);
								},
								$$slots: { default: !0 }
							}),
								t(),
								e($, i));
						},
						$$slots: { default: !0 }
					}),
						e(s, o));
				},
				$$slots: { default: !0 }
			}),
				e(Kr, U));
		}
	});
}
export { ll as default, to as metadata };
