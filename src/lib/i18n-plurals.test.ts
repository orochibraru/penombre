import { describe, expect, test } from "bun:test";
import { storage_files_count as filesCount } from "./paraglide/messages/storage_files_count.js";
import { toast_items_moved as itemsMoved } from "./paraglide/messages/toast_items_moved.js";
import { m } from "./paraglide/messages.js";

/**
 * Proves paraglide's native plural-variant messages resolve through
 * Intl.PluralRules per locale (ru/pl few-vs-many, fr's 0-is-singular,
 * ja's single form). See CLAUDE.md "i18n keys".
 */
describe("plural messages", () => {
	test("ru: one / few / many, and the many form at 21", () => {
		expect(filesCount({ count: "1", size: "1 KB" }, { locale: "ru" })).toBe(
			"1 файл · 1 KB",
		);
		expect(filesCount({ count: "2", size: "1 KB" }, { locale: "ru" })).toBe(
			"2 файла · 1 KB",
		);
		expect(filesCount({ count: "5", size: "1 KB" }, { locale: "ru" })).toBe(
			"5 файлов · 1 KB",
		);
		expect(filesCount({ count: "21", size: "1 KB" }, { locale: "ru" })).toBe(
			"21 файл · 1 KB",
		);
	});

	test("pl: one / few / many, and the few form at 22", () => {
		expect(filesCount({ count: "1", size: "1 KB" }, { locale: "pl" })).toBe(
			"Liczba plików: 1 · 1 KB",
		);
		expect(filesCount({ count: "22", size: "1 KB" }, { locale: "pl" })).toBe(
			"Liczba plików: 22 · 1 KB",
		);
	});

	test("fr: 0 and 1 are both singular", () => {
		expect(filesCount({ count: "0", size: "1 KB" }, { locale: "fr" })).toBe(
			"0 fichier · 1 KB",
		);
		expect(filesCount({ count: "1", size: "1 KB" }, { locale: "fr" })).toBe(
			"1 fichier · 1 KB",
		);
		expect(filesCount({ count: "2", size: "1 KB" }, { locale: "fr" })).toBe(
			"2 fichiers · 1 KB",
		);
	});

	test("en: one vs other", () => {
		expect(filesCount({ count: "1", size: "1 KB" }, { locale: "en" })).toBe(
			"1 file · 1 KB",
		);
		expect(filesCount({ count: "2", size: "1 KB" }, { locale: "en" })).toBe(
			"2 files · 1 KB",
		);
	});

	test("ja: single form regardless of count", () => {
		expect(filesCount({ count: "1", size: "1 KB" }, { locale: "ja" })).toBe(
			"1件のファイル · 1 KB",
		);
		expect(filesCount({ count: "5", size: "1 KB" }, { locale: "ja" })).toBe(
			"5件のファイル · 1 KB",
		);
	});
});

describe("toast_items_moved plurals", () => {
	const args = (total: string) => ({
		successCount: total,
		total,
		destination: "Docs",
	});

	test("ru: one / few / many, selected on total", () => {
		expect(itemsMoved(args("1"), { locale: "ru" })).toBe(
			"Перемещено 1 из 1 элемента в Docs",
		);
		expect(itemsMoved(args("2"), { locale: "ru" })).toBe(
			"Перемещено 2 из 2 элементов в Docs",
		);
		expect(itemsMoved(args("5"), { locale: "ru" })).toBe(
			"Перемещено 5 из 5 элементов в Docs",
		);
	});

	test("en: one vs other", () => {
		expect(itemsMoved(args("1"), { locale: "en" })).toBe(
			"Moved 1 of 1 item to Docs",
		);
		expect(itemsMoved(args("2"), { locale: "en" })).toBe(
			"Moved 2 of 2 items to Docs",
		);
	});
});

interface Row {
	key: string;
	fn: (inputs: never, options: never) => string;
	args: (n: string) => Record<string, string>;
	cases: Record<string, Record<string, string>>;
}

const count = (n: string) => ({ count: n });

const passwordHint: Row["cases"] = {
	en: { 1: "At least 1 character.", 2: "At least 2 characters." },
	fr: {
		0: "Au moins 0 caractère.",
		1: "Au moins 1 caractère.",
		2: "Au moins 2 caractères.",
	},
	ru: {
		1: "Не менее 1 символа.",
		2: "Не менее 2 символов.",
		5: "Не менее 5 символов.",
		21: "Не менее 21 символа.",
		22: "Не менее 22 символов.",
	},
	pl: {
		1: "Co najmniej 1 znak.",
		2: "Co najmniej 2 znaki.",
		5: "Co najmniej 5 znaków.",
		22: "Co najmniej 22 znaki.",
	},
	fi: { 1: "Vähintään 1 merkki.", 2: "Vähintään 2 merkkiä." },
	ja: { 1: "1文字以上。", 5: "5文字以上。" },
};

// Each case: locale -> { n: expected }. Two-input keys fix the other input at 3.
const rows: Row[] = [
	{
		key: "items_count",
		fn: m.items_count,
		args: count,
		cases: {
			en: { 1: "1 item", 2: "2 items" },
			fr: { 0: "0 élément", 1: "1 élément", 2: "2 éléments" },
			ru: {
				1: "Элементов: 1",
				2: "Элементов: 2",
				5: "Элементов: 5",
				21: "Элементов: 21",
				22: "Элементов: 22",
			},
			pl: {
				1: "Liczba elementów: 1",
				2: "Liczba elementów: 2",
				5: "Liczba elementów: 5",
				22: "Liczba elementów: 22",
			},
			fi: { 1: "1 kohde", 2: "2 kohdetta" },
			ja: { 1: "1件の項目", 5: "5件の項目" },
		},
	},
	{
		key: "files_progress",
		fn: m.files_progress,
		args: (n) => ({ completed: "3", total: n }),
		cases: {
			en: { 1: "3 of 1 file", 2: "3 of 2 files" },
			fr: { 0: "3 sur 0 fichier", 1: "3 sur 1 fichier", 2: "3 sur 2 fichiers" },
			ru: {
				1: "3 из 1 файла",
				2: "3 из 2 файлов",
				5: "3 из 5 файлов",
				21: "3 из 21 файла",
				22: "3 из 22 файлов",
			},
			pl: {
				1: "3 z 1 pliku",
				2: "3 z 2 plików",
				5: "3 z 5 plików",
				22: "3 z 22 plików",
			},
			fi: { 1: "3/1 tiedosto", 2: "3/2 tiedostoa" },
			ja: { 1: "1件中3件のファイル", 5: "5件中3件のファイル" },
		},
	},
	{
		key: "volume_scan_files",
		fn: m.volume_scan_files,
		args: (n) => ({ done: n, total: n }),
		cases: {
			en: { 1: "1 of 1 file", 2: "2 of 2 files" },
			fr: { 0: "0 fichier sur 0", 1: "1 fichier sur 1", 2: "2 fichiers sur 2" },
			ru: {
				1: "1 из 1 файла",
				2: "2 из 2 файлов",
				5: "5 из 5 файлов",
				21: "21 из 21 файла",
				22: "22 из 22 файлов",
			},
			pl: {
				1: "1 z 1 pliku",
				2: "2 z 2 plików",
				5: "5 z 5 plików",
				22: "22 z 22 plików",
			},
			fi: { 1: "1/1 tiedosto", 2: "2/2 tiedostoa" },
			ja: { 1: "1件中1件のファイル", 5: "5件中5件のファイル" },
		},
	},
	{
		key: "toast_moving_items",
		fn: m.toast_moving_items,
		args: count,
		cases: {
			en: { 1: "Moving 1 item...", 2: "Moving 2 items..." },
			fr: {
				0: "Déplacement de 0 élément...",
				1: "Déplacement de 1 élément...",
				2: "Déplacement de 2 éléments...",
			},
			ru: {
				1: "Перемещение 1 элемента...",
				2: "Перемещение 2 элементов...",
				5: "Перемещение 5 элементов...",
				21: "Перемещение 21 элемента...",
				22: "Перемещение 22 элементов...",
			},
			pl: {
				1: "Przenoszenie 1 elementu...",
				2: "Przenoszenie 2 elementów...",
				5: "Przenoszenie 5 elementów...",
				22: "Przenoszenie 22 elementów...",
			},
			fi: { 1: "Siirretään 1 kohde...", 2: "Siirretään 2 kohdetta..." },
			ja: { 1: "1件の項目を移動しています…", 5: "5件の項目を移動しています…" },
		},
	},
	{
		key: "toast_creating_zip_files",
		fn: m.toast_creating_zip_files,
		args: count,
		cases: {
			en: { 1: "Creating zip of 1 file...", 2: "Creating zip of 2 files..." },
			fr: {
				0: "Création du zip de 0 fichier...",
				1: "Création du zip de 1 fichier...",
				2: "Création du zip de 2 fichiers...",
			},
			ru: {
				1: "Создание zip-архива из 1 файла...",
				2: "Создание zip-архива из 2 файлов...",
				5: "Создание zip-архива из 5 файлов...",
				21: "Создание zip-архива из 21 файла...",
				22: "Создание zip-архива из 22 файлов...",
			},
			pl: {
				1: "Tworzenie archiwum zip z 1 pliku...",
				2: "Tworzenie archiwum zip z 2 plików...",
				5: "Tworzenie archiwum zip z 5 plików...",
				22: "Tworzenie archiwum zip z 22 plików...",
			},
			fi: {
				1: "Luodaan zip-tiedostoa 1 tiedostosta...",
				2: "Luodaan zip-tiedostoa 2 tiedostosta...",
			},
			ja: {
				1: "1件のファイルのZIPを作成しています…",
				5: "5件のファイルのZIPを作成しています…",
			},
		},
	},
	{
		key: "toast_downloaded_files",
		fn: m.toast_downloaded_files,
		args: count,
		cases: {
			en: { 1: "Download of 1 file started", 2: "Download of 2 files started" },
			fr: {
				0: "Téléchargement de 0 fichier démarré",
				1: "Téléchargement de 1 fichier démarré",
				2: "Téléchargement de 2 fichiers démarré",
			},
			ru: {
				1: "Начата загрузка 1 файла",
				2: "Начата загрузка 2 файлов",
				5: "Начата загрузка 5 файлов",
				21: "Начата загрузка 21 файла",
				22: "Начата загрузка 22 файлов",
			},
			pl: {
				1: "Rozpoczęto pobieranie 1 pliku",
				2: "Rozpoczęto pobieranie 2 plików",
				5: "Rozpoczęto pobieranie 5 plików",
				22: "Rozpoczęto pobieranie 22 plików",
			},
			fi: {
				1: "1 tiedoston lataus käynnistyi",
				2: "2 tiedoston lataus käynnistyi",
			},
			ja: {
				1: "1件のファイルのダウンロードを開始しました",
				5: "5件のファイルのダウンロードを開始しました",
			},
		},
	},
	{
		key: "toast_restoring_items",
		fn: m.toast_restoring_items,
		args: count,
		cases: {
			en: { 1: "Restoring 1 item", 2: "Restoring 2 items" },
			fr: {
				0: "Restauration de 0 élément",
				1: "Restauration de 1 élément",
				2: "Restauration de 2 éléments",
			},
			ru: {
				1: "Восстановление 1 элемента",
				2: "Восстановление 2 элементов",
				5: "Восстановление 5 элементов",
				21: "Восстановление 21 элемента",
				22: "Восстановление 22 элементов",
			},
			pl: {
				1: "Przywracanie 1 elementu",
				2: "Przywracanie 2 elementów",
				5: "Przywracanie 5 elementów",
				22: "Przywracanie 22 elementów",
			},
			fi: { 1: "Palautetaan 1 kohde", 2: "Palautetaan 2 kohdetta" },
			ja: { 1: "1件の項目を復元しています", 5: "5件の項目を復元しています" },
		},
	},
	{
		key: "toast_items_restored",
		fn: m.toast_items_restored,
		args: count,
		cases: {
			en: { 1: "1 item restored", 2: "2 items restored" },
			fr: {
				0: "0 élément restauré",
				1: "1 élément restauré",
				2: "2 éléments restaurés",
			},
			ru: {
				1: "Восстановлено элементов: 1",
				2: "Восстановлено элементов: 2",
				5: "Восстановлено элементов: 5",
				21: "Восстановлено элементов: 21",
				22: "Восстановлено элементов: 22",
			},
			pl: {
				1: "Przywrócono elementów: 1",
				2: "Przywrócono elementów: 2",
				5: "Przywrócono elementów: 5",
				22: "Przywrócono elementów: 22",
			},
			fi: { 1: "1 kohde palautettu", 2: "2 kohdetta palautettu" },
			ja: { 1: "1件の項目を復元しました", 5: "5件の項目を復元しました" },
		},
	},
	{
		key: "toast_restore_items_error",
		fn: m.toast_restore_items_error,
		args: count,
		cases: {
			en: { 1: "Failed to restore 1 item", 2: "Failed to restore 2 items" },
			fr: {
				0: "Échec de la restauration de 0 élément",
				1: "Échec de la restauration de 1 élément",
				2: "Échec de la restauration de 2 éléments",
			},
			ru: {
				1: "Не удалось восстановить элементы (1)",
				2: "Не удалось восстановить элементы (2)",
				5: "Не удалось восстановить элементы (5)",
				21: "Не удалось восстановить элементы (21)",
				22: "Не удалось восстановить элементы (22)",
			},
			pl: {
				1: "Nie udało się przywrócić elementów (1)",
				2: "Nie udało się przywrócić elementów (2)",
				5: "Nie udało się przywrócić elementów (5)",
				22: "Nie udało się przywrócić elementów (22)",
			},
			fi: {
				1: "1 kohteen palautus epäonnistui",
				2: "2 kohteen palautus epäonnistui",
			},
			ja: {
				1: "1件の項目の復元に失敗しました",
				5: "5件の項目の復元に失敗しました",
			},
		},
	},
	{
		key: "toast_deleting_permanently",
		fn: m.toast_deleting_permanently,
		args: count,
		cases: {
			en: {
				1: "Deleting 1 item permanently",
				2: "Deleting 2 items permanently",
			},
			fr: {
				0: "Suppression définitive de 0 élément",
				1: "Suppression définitive de 1 élément",
				2: "Suppression définitive de 2 éléments",
			},
			ru: {
				1: "Безвозвратное удаление 1 элемента",
				2: "Безвозвратное удаление 2 элементов",
				5: "Безвозвратное удаление 5 элементов",
				21: "Безвозвратное удаление 21 элемента",
				22: "Безвозвратное удаление 22 элементов",
			},
			pl: {
				1: "Trwałe usuwanie 1 elementu",
				2: "Trwałe usuwanie 2 elementów",
				5: "Trwałe usuwanie 5 elementów",
				22: "Trwałe usuwanie 22 elementów",
			},
			fi: {
				1: "Poistetaan 1 kohde pysyvästi",
				2: "Poistetaan 2 kohdetta pysyvästi",
			},
			ja: {
				1: "1件の項目を完全に削除しています",
				5: "5件の項目を完全に削除しています",
			},
		},
	},
	{
		key: "toast_items_deleted_permanently",
		fn: m.toast_items_deleted_permanently,
		args: count,
		cases: {
			en: { 1: "1 item deleted permanently", 2: "2 items deleted permanently" },
			fr: {
				0: "0 élément supprimé définitivement",
				1: "1 élément supprimé définitivement",
				2: "2 éléments supprimés définitivement",
			},
			ru: {
				1: "Безвозвратно удалено элементов: 1",
				2: "Безвозвратно удалено элементов: 2",
				5: "Безвозвратно удалено элементов: 5",
				21: "Безвозвратно удалено элементов: 21",
				22: "Безвозвратно удалено элементов: 22",
			},
			pl: {
				1: "Trwale usunięto elementów: 1",
				2: "Trwale usunięto elementów: 2",
				5: "Trwale usunięto elementów: 5",
				22: "Trwale usunięto elementów: 22",
			},
			fi: {
				1: "1 kohde poistettu pysyvästi",
				2: "2 kohdetta poistettu pysyvästi",
			},
			ja: {
				1: "1件の項目を完全に削除しました",
				5: "5件の項目を完全に削除しました",
			},
		},
	},
	{
		key: "toast_delete_permanently_error",
		fn: m.toast_delete_permanently_error,
		args: count,
		cases: {
			en: {
				1: "Failed to delete 1 item permanently",
				2: "Failed to delete 2 items permanently",
			},
			fr: {
				0: "Échec de la suppression définitive de 0 élément",
				1: "Échec de la suppression définitive de 1 élément",
				2: "Échec de la suppression définitive de 2 éléments",
			},
			ru: {
				1: "Не удалось безвозвратно удалить элементы (1)",
				2: "Не удалось безвозвратно удалить элементы (2)",
				5: "Не удалось безвозвратно удалить элементы (5)",
				21: "Не удалось безвозвратно удалить элементы (21)",
				22: "Не удалось безвозвратно удалить элементы (22)",
			},
			pl: {
				1: "Nie udało się trwale usunąć elementów (1)",
				2: "Nie udało się trwale usunąć elementów (2)",
				5: "Nie udało się trwale usunąć elementów (5)",
				22: "Nie udało się trwale usunąć elementów (22)",
			},
			fi: {
				1: "1 kohteen pysyvä poisto epäonnistui",
				2: "2 kohteen pysyvä poisto epäonnistui",
			},
			ja: {
				1: "1件の項目の完全削除に失敗しました",
				5: "5件の項目の完全削除に失敗しました",
			},
		},
	},
	{
		key: "toast_moving_to_trash",
		fn: m.toast_moving_to_trash,
		args: count,
		cases: {
			en: { 1: "Moving 1 item to trash", 2: "Moving 2 items to trash" },
			fr: {
				0: "Déplacement de 0 élément vers la corbeille",
				1: "Déplacement de 1 élément vers la corbeille",
				2: "Déplacement de 2 éléments vers la corbeille",
			},
			ru: {
				1: "Перемещение 1 элемента в корзину",
				2: "Перемещение 2 элементов в корзину",
				5: "Перемещение 5 элементов в корзину",
				21: "Перемещение 21 элемента в корзину",
				22: "Перемещение 22 элементов в корзину",
			},
			pl: {
				1: "Przenoszenie 1 elementu do kosza",
				2: "Przenoszenie 2 elementów do kosza",
				5: "Przenoszenie 5 elementów do kosza",
				22: "Przenoszenie 22 elementów do kosza",
			},
			fi: {
				1: "Siirretään 1 kohde roskakoriin",
				2: "Siirretään 2 kohdetta roskakoriin",
			},
			ja: {
				1: "1件の項目をゴミ箱に移動しています",
				5: "5件の項目をゴミ箱に移動しています",
			},
		},
	},
	{
		key: "toast_items_moved_to_trash",
		fn: m.toast_items_moved_to_trash,
		args: count,
		cases: {
			en: { 1: "1 item moved to trash", 2: "2 items moved to trash" },
			fr: {
				0: "0 élément déplacé vers la corbeille",
				1: "1 élément déplacé vers la corbeille",
				2: "2 éléments déplacés vers la corbeille",
			},
			ru: {
				1: "В корзину перемещено элементов: 1",
				2: "В корзину перемещено элементов: 2",
				5: "В корзину перемещено элементов: 5",
				21: "В корзину перемещено элементов: 21",
				22: "В корзину перемещено элементов: 22",
			},
			pl: {
				1: "Przeniesiono do kosza elementów: 1",
				2: "Przeniesiono do kosza elementów: 2",
				5: "Przeniesiono do kosza elementów: 5",
				22: "Przeniesiono do kosza elementów: 22",
			},
			fi: {
				1: "1 kohde siirretty roskakoriin",
				2: "2 kohdetta siirretty roskakoriin",
			},
			ja: {
				1: "1件の項目をゴミ箱に移動しました",
				5: "5件の項目をゴミ箱に移動しました",
			},
		},
	},
	{
		key: "toast_move_to_trash_error",
		fn: m.toast_move_to_trash_error,
		args: count,
		cases: {
			en: {
				1: "Failed to move 1 item to trash",
				2: "Failed to move 2 items to trash",
			},
			fr: {
				0: "Échec du déplacement de 0 élément vers la corbeille",
				1: "Échec du déplacement de 1 élément vers la corbeille",
				2: "Échec du déplacement de 2 éléments vers la corbeille",
			},
			ru: {
				1: "Не удалось переместить элементы в корзину (1)",
				2: "Не удалось переместить элементы в корзину (2)",
				5: "Не удалось переместить элементы в корзину (5)",
				21: "Не удалось переместить элементы в корзину (21)",
				22: "Не удалось переместить элементы в корзину (22)",
			},
			pl: {
				1: "Nie udało się przenieść elementów do kosza (1)",
				2: "Nie udało się przenieść elementów do kosza (2)",
				5: "Nie udało się przenieść elementów do kosza (5)",
				22: "Nie udało się przenieść elementów do kosza (22)",
			},
			fi: {
				1: "1 kohteen siirto roskakoriin epäonnistui",
				2: "2 kohteen siirto roskakoriin epäonnistui",
			},
			ja: {
				1: "1件の項目のゴミ箱への移動に失敗しました",
				5: "5件の項目のゴミ箱への移動に失敗しました",
			},
		},
	},
	{
		key: "share_expiry_days",
		fn: m.share_expiry_days,
		args: count,
		cases: {
			en: { 1: "In 1 day", 2: "In 2 days" },
			fr: { 0: "Dans 0 jour", 1: "Dans 1 jour", 2: "Dans 2 jours" },
			ru: {
				1: "Через 1 день",
				2: "Через 2 дня",
				5: "Через 5 дней",
				21: "Через 21 день",
				22: "Через 22 дня",
			},
			pl: { 1: "Za 1 dzień", 2: "Za 2 dni", 5: "Za 5 dni", 22: "Za 22 dni" },
			fi: { 1: "1 päivän kuluttua", 2: "2 päivän kuluttua" },
			ja: { 1: "1日後", 5: "5日後" },
		},
	},
	{
		key: "onboarding_password_rules",
		fn: m.onboarding_password_rules,
		args: count,
		cases: passwordHint,
	},
	{
		key: "setup_password_hint",
		fn: m.setup_password_hint,
		args: count,
		cases: passwordHint,
	},
	{
		key: "form_error_password_too_short",
		fn: m.form_error_password_too_short,
		args: count,
		cases: {
			en: {
				1: "Password must be at least 1 character.",
				2: "Password must be at least 2 characters.",
			},
			fr: {
				0: "Le mot de passe doit contenir au moins 0 caractère.",
				1: "Le mot de passe doit contenir au moins 1 caractère.",
				2: "Le mot de passe doit contenir au moins 2 caractères.",
			},
			ru: {
				1: "Пароль должен содержать не менее 1 символа.",
				2: "Пароль должен содержать не менее 2 символов.",
				5: "Пароль должен содержать не менее 5 символов.",
				21: "Пароль должен содержать не менее 21 символа.",
				22: "Пароль должен содержать не менее 22 символов.",
			},
			pl: {
				1: "Hasło musi mieć co najmniej 1 znak.",
				2: "Hasło musi mieć co najmniej 2 znaki.",
				5: "Hasło musi mieć co najmniej 5 znaków.",
				22: "Hasło musi mieć co najmniej 22 znaki.",
			},
			fi: {
				1: "Salasanassa on oltava vähintään 1 merkki.",
				2: "Salasanassa on oltava vähintään 2 merkkiä.",
			},
			ja: {
				1: "パスワードは1文字以上である必要があります。",
				5: "パスワードは5文字以上である必要があります。",
			},
		},
	},
	{
		key: "toast_trash_emptied_partial",
		fn: m.toast_trash_emptied_partial,
		args: count,
		cases: {
			en: {
				1: "1 item could not be deleted and is still in the trash",
				2: "2 items could not be deleted and are still in the trash",
			},
			fr: {
				0: "0 élément n'a pas pu être supprimé et est toujours dans la corbeille",
				1: "1 élément n'a pas pu être supprimé et est toujours dans la corbeille",
				2: "2 éléments n'ont pas pu être supprimés et sont toujours dans la corbeille",
			},
			ru: {
				1: "1 элемент не удалось удалить, он всё ещё в корзине",
				2: "2 элемента не удалось удалить, они всё ещё в корзине",
				5: "5 элементов не удалось удалить, они всё ещё в корзине",
				21: "21 элемент не удалось удалить, он всё ещё в корзине",
				22: "22 элемента не удалось удалить, они всё ещё в корзине",
			},
			pl: {
				1: "Nie udało się usunąć 1 elementu, nadal znajduje się w koszu",
				2: "Nie udało się usunąć 2 elementów, nadal znajdują się w koszu",
				5: "Nie udało się usunąć 5 elementów, nadal znajdują się w koszu",
				22: "Nie udało się usunąć 22 elementów, nadal znajdują się w koszu",
			},
			fi: {
				1: "1 kohdetta ei voitu poistaa ja se on yhä roskakorissa",
				2: "2 kohdetta ei voitu poistaa ja ne ovat yhä roskakorissa",
			},
			ja: {
				1: "1件の項目を削除できず、ゴミ箱に残っています",
				5: "5件の項目を削除できず、ゴミ箱に残っています",
			},
		},
	},
];

describe.each(rows)("$key", ({ fn, args, cases }) => {
	for (const [locale, byCount] of Object.entries(cases)) {
		test(locale, () => {
			for (const [n, expected] of Object.entries(byCount)) {
				expect(fn(args(n) as never, { locale } as never)).toBe(expected);
			}
		});
	}
});
