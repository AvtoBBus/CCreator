import type { UserSnippets } from '../shared/types';

/**
 * Применяет сниппеты к строке структуры.
 * Заменяет `{SNIPPET_NAME}` на результат выполнения `snippet.value()`.
 */
export function applySnippets(input: string, snippets: UserSnippets[]): string {
    let result = input;

    for (const snippet of snippets) {
        if (!result.includes(`{${snippet.snippetName}}`)) {
            continue;
        }

        try {
            const value = eval(snippet.value)();
            result = result.replaceAll(`{${snippet.snippetName}}`, String(value));
        } catch {
            // eval не удался — пропускаем сниппет
        }
    }

    return result;
}
