import {
	e as n,
	u as C,
	c as d,
	S as m,
	m as y,
	k as r,
	W as I,
	i as p,
	t as N,
	d as k,
	q as u,
	h as _,
	F as b,
	B as E,
	E as z,
	U as x
} from './B52X6CO-.js';
import { V as S, F as H, B as T, a as c, b as B, c as U } from './BOW00QWY.js';
class v extends y('Opus') {}
class A {
	constructor(e) {
		if (e < 19) throw new v('ID-header-page 0 should be at least 19 bytes long');
		this.len = e;
	}
	get(e, t) {
		return {
			magicSignature: new m(8, 'ascii').get(e, t + 0),
			version: n.get(e, t + 8),
			channelCount: n.get(e, t + 9),
			preSkip: C.get(e, t + 10),
			inputSampleRate: d.get(e, t + 12),
			outputGain: C.get(e, t + 16),
			channelMapping: n.get(e, t + 18)
		};
	}
}
class L extends S {
	constructor(e, t, s) {
		(super(e, t), (this.idHeader = null), (this.lastPos = -1), (this.tokenizer = s));
	}
	parseFirstPage(e, t) {
		if (
			(this.metadata.setFormat('codec', 'Opus'),
			(this.idHeader = new A(t.length).get(t, 0)),
			this.idHeader.magicSignature !== 'OpusHead')
		)
			throw new v('Illegal ogg/Opus magic-signature');
		(this.metadata.setFormat('sampleRate', this.idHeader.inputSampleRate),
			this.metadata.setFormat('numberOfChannels', this.idHeader.channelCount),
			this.metadata.setAudioOnly());
	}
	async parseFullPage(e) {
		switch (new m(8, 'ascii').get(e, 0)) {
			case 'OpusTags':
				(await this.parseUserCommentList(e, 8),
					(this.lastPos = this.tokenizer.position - e.length));
				break;
		}
	}
	calculateDuration() {
		if (
			this.lastPageHeader &&
			this.metadata.format.sampleRate &&
			this.lastPageHeader.absoluteGranulePosition >= 0
		) {
			const e = this.lastPageHeader.absoluteGranulePosition - this.idHeader.preSkip;
			if (
				(this.metadata.setFormat('numberOfSamples', e),
				this.metadata.setFormat('duration', e / 48e3),
				this.lastPos !== -1 && this.tokenizer.fileInfo.size && this.metadata.format.duration)
			) {
				const t = this.tokenizer.fileInfo.size - this.lastPos;
				this.metadata.setFormat('bitrate', (8 * t) / this.metadata.format.duration);
			}
		}
	}
}
const $ = {
		len: 80,
		get: (a, e) => ({
			speex: new m(8, 'ascii').get(a, e + 0),
			version: I(new m(20, 'ascii').get(a, e + 8)),
			version_id: r.get(a, e + 28),
			header_size: r.get(a, e + 32),
			rate: r.get(a, e + 36),
			mode: r.get(a, e + 40),
			mode_bitstream_version: r.get(a, e + 44),
			nb_channels: r.get(a, e + 48),
			bitrate: r.get(a, e + 52),
			frame_size: r.get(a, e + 56),
			vbr: r.get(a, e + 60),
			frames_per_packet: r.get(a, e + 64),
			extra_headers: r.get(a, e + 68),
			reserved1: r.get(a, e + 72),
			reserved2: r.get(a, e + 76)
		})
	},
	R = p('music-metadata:parser:ogg:speex');
class V extends S {
	constructor(e, t, s) {
		(super(e, t), (this.tokenizer = s));
	}
	parseFirstPage(e, t) {
		R('First Ogg/Speex page');
		const s = $.get(t, 0);
		(this.metadata.setFormat('codec', `Speex ${s.version}`),
			this.metadata.setFormat('numberOfChannels', s.nb_channels),
			this.metadata.setFormat('sampleRate', s.rate),
			s.bitrate !== -1 && this.metadata.setFormat('bitrate', s.bitrate),
			this.metadata.setAudioOnly());
	}
}
const M = {
		len: 42,
		get: (a, e) => ({
			id: new m(7, 'ascii').get(a, e),
			vmaj: n.get(a, e + 7),
			vmin: n.get(a, e + 8),
			vrev: n.get(a, e + 9),
			vmbw: k.get(a, e + 10),
			vmbh: k.get(a, e + 17),
			nombr: N.get(a, e + 37),
			nqual: n.get(a, e + 40)
		})
	},
	F = p('music-metadata:parser:ogg:theora');
class q {
	constructor(e, t, s) {
		((this.metadata = e), (this.tokenizer = s));
	}
	async parsePage(e, t) {
		e.headerType.firstPage && (await this.parseFirstPage(e, t));
	}
	calculateDuration() {
		F('duration calculation not implemented');
	}
	async parseFirstPage(e, t) {
		(F('First Ogg/Theora page'), this.metadata.setFormat('codec', 'Theora'));
		const s = M.get(t, 0);
		(this.metadata.setFormat('bitrate', s.nombr), this.metadata.setFormat('hasVideo', !0));
	}
	flush() {
		return Promise.resolve();
	}
}
const D = {
	len: 27,
	get: (a, e) => ({
		capturePattern: new m(4, 'latin1').get(a, e),
		version: n.get(a, e + 4),
		headerType: { continued: u(a, e + 5, 0), firstPage: u(a, e + 5, 1), lastPage: u(a, e + 5, 2) },
		absoluteGranulePosition: Number(_.get(a, e + 6)),
		streamSerialNumber: d.get(a, e + 14),
		pageSequenceNo: d.get(a, e + 18),
		pageChecksum: d.get(a, e + 22),
		page_segments: n.get(a, e + 26)
	})
};
class O {
	static sum(e, t, s) {
		const o = new DataView(e.buffer, 0);
		let h = 0;
		for (let g = t; g < t + s; ++g) h += o.getUint8(g);
		return h;
	}
	constructor(e) {
		this.len = e.page_segments;
	}
	get(e, t) {
		return { totalPageSize: O.sum(e, t, this.len) };
	}
}
const P = p('music-metadata:parser:ogg:theora');
class G {
	constructor(e, t, s) {
		((this.metadata = e),
			(this.options = t),
			(this.tokenizer = s),
			(this.flacParser = new H(this.metadata, this.tokenizer, t)));
	}
	async parsePage(e, t) {
		e.headerType.firstPage && (await this.parseFirstPage(e, t));
	}
	calculateDuration() {
		P('duration calculation not implemented');
	}
	async parseFirstPage(e, t) {
		if ((P('First Ogg/FLAC page'), (await b.get(t, 9)).toString() !== 'fLaC'))
			throw new Error('Invalid FLAC preamble');
		const o = await T.get(t, 13);
		await this.parseDataBlock(o, t.subarray(13 + T.len));
	}
	async parseDataBlock(e, t) {
		switch ((P(`blockHeader type=${e.type}, length=${e.length}`), e.type)) {
			case c.STREAMINFO: {
				const s = U.get(t, 0);
				return this.flacParser.processsStreamInfo(s);
			}
			case c.PADDING:
				break;
			case c.APPLICATION:
				break;
			case c.SEEKTABLE:
				break;
			case c.VORBIS_COMMENT:
				return this.flacParser.parseComment(t);
			case c.PICTURE:
				if (!this.options.skipCovers) {
					const s = new B(t.length).get(t, 0);
					return this.flacParser.addPictureTag(s);
				}
				break;
			default:
				this.metadata.addWarning(`Unknown block type: ${e.type}`);
		}
		return this.tokenizer.ignore(e.length).then();
	}
	flush() {
		return Promise.resolve();
	}
}
class w extends y('Ogg') {}
const i = p('music-metadata:parser:ogg');
class W {
	constructor(e, t, s) {
		((this.pageNumber = 0),
			(this.closed = !1),
			(this.metadata = e),
			(this.streamSerial = t),
			(this.options = s));
	}
	async parsePage(e, t) {
		((this.pageNumber = t.pageSequenceNo),
			i('serial=%s page#=%s, Ogg.id=%s', t.streamSerialNumber, t.pageSequenceNo, t.capturePattern));
		const s = await e.readToken(new O(t));
		i('totalPageSize=%s', s.totalPageSize);
		const o = await e.readToken(new x(s.totalPageSize));
		if (
			(i(
				'firstPage=%s, lastPage=%s, continued=%s',
				t.headerType.firstPage,
				t.headerType.lastPage,
				t.headerType.continued
			),
			t.headerType.firstPage)
		) {
			const h = o.slice(0, 7),
				g = Array.from(h)
					.filter((l) => l >= 32 && l <= 126)
					.map((l) => String.fromCharCode(l))
					.join('');
			switch (g) {
				case 'vorbis':
					(i(`Set Ogg stream serial ${t.streamSerialNumber}, codec=Vorbis`),
						(this.pageConsumer = new S(this.metadata, this.options)));
					break;
				case 'OpusHea':
					(i('Set page consumer to Ogg/Opus'),
						(this.pageConsumer = new L(this.metadata, this.options, e)));
					break;
				case 'Speex  ':
					(i('Set page consumer to Ogg/Speex'),
						(this.pageConsumer = new V(this.metadata, this.options, e)));
					break;
				case 'fishead':
				case 'theora':
					(i('Set page consumer to Ogg/Theora'),
						(this.pageConsumer = new q(this.metadata, this.options, e)));
					break;
				case 'FLAC':
					(i('Set page consumer to Vorbis'),
						(this.pageConsumer = new G(this.metadata, this.options, e)));
					break;
				default:
					throw new w(`Ogg codec not recognized (id=${g}`);
			}
		}
		if ((t.headerType.lastPage && (this.closed = !0), this.pageConsumer))
			await this.pageConsumer.parsePage(t, o);
		else throw new Error('pageConsumer should be initialized');
	}
}
class J extends E {
	constructor() {
		(super(...arguments), (this.streams = new Map()));
	}
	async parse() {
		((this.streams = new Map()), i('pos=%s, parsePage()', this.tokenizer.position));
		let e;
		try {
			do {
				if (((e = await this.tokenizer.readToken(D)), e.capturePattern !== 'OggS'))
					throw new w('Invalid Ogg capture pattern');
				this.metadata.setFormat('container', 'Ogg');
				let t = this.streams.get(e.streamSerialNumber);
				(t ||
					((t = new W(this.metadata, e.streamSerialNumber, this.options)),
					this.streams.set(e.streamSerialNumber, t)),
					await t.parsePage(this.tokenizer, e));
			} while (![...this.streams.values()].every((t) => t.closed));
		} catch (t) {
			if (t instanceof z) i('Reached end-of-stream');
			else if (t instanceof w)
				this.metadata.addWarning(`Corrupt Ogg content at ${this.tokenizer.position}`);
			else throw t;
		}
		for (const t of this.streams.values())
			(t.closed ||
				(this.metadata.addWarning(
					`End-of-stream reached before reaching last page in Ogg stream serial=${t.streamSerial}`
				),
				await t.pageConsumer?.flush()),
				t.pageConsumer?.calculateDuration());
	}
}
export { w as OggContentError, J as OggParser };
