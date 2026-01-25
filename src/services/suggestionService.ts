export const getSuggestions = async (query: string): Promise<string[]> => {
  if (!query) return [];

  return new Promise((resolve) => {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());

    // Define global callback
    (window as any)[callbackName] = (data: any) => {
      delete (window as any)[callbackName];
      try {
        document.body.removeChild(script);
      } catch (e) {}

      // YouTube Autocomplete API returns [query, [ [suggestion, 0, ...] ], ...]
      if (data && data[1]) {
        const results = data[1].map((item: any) => item[0]);
        resolve(results);
      } else {
        resolve([]);
      }
    };

    const script = document.createElement('script');
    script.src = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}&callback=${callbackName}`;
    script.onerror = () => {
      delete (window as any)[callbackName];
      try {
        document.body.removeChild(script);
      } catch (e) {}
      resolve([]);
    };
    document.body.appendChild(script);
  });
};
