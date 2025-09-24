type FetchReturnType<K> = K extends "arrayBuffer"
	? ArrayBuffer
	: K extends "blob"
	? Blob
	: K extends "formData"
	? FormData
	: K extends "json"
	? unknown
	: K extends "text"
	? string
	: Response;

type ResponseBodyMethod = "json" | "text" | "arrayBuffer" | "blob" | "formData";

const fetchContent = async <T = FetchReturnType<ResponseBodyMethod>>(
	url: string | URL,
	fetchOps: RequestInit,
	getAs: ResponseBodyMethod
): Promise<T> => {
	const res = await fetch(url, fetchOps);
	return res[getAs]() as T;
};

export default {
	get(
		url: string | URL,
		as: ResponseBodyMethod = "text",
		fetchOps?: RequestInit
	) {
		return fetchContent(url, { ...fetchOps, method: "GET" }, as);
	},

	post(
		url: string | URL,
		body: BodyInit | null = null,
		as: ResponseBodyMethod = "text",
		fetchOps?: RequestInit
	) {
		return fetchContent(url, { ...fetchOps, method: "POST", body }, as);
	},

	fetch: fetchContent,
};
