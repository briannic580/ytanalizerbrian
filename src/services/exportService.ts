import { VideoItem } from '../types';

export const generateCSV = (videos: VideoItem[], filename: string) => {
  // CSV Header
  const headers = [
    "No",
    "Title",
    "Video ID",
    "URL",
    "Duration",
    "Published Date",
    "Views",
    "Likes",
    "Comments",
    "Engagement Rate (%)",
    "Tags",
    "Type"
  ];

  // CSV Rows
  const rows = videos.map((v, index) => {
    // Escape quotes in text fields
    const safeTitle = `"${v.title.replace(/"/g, '""')}"`;
    const safeTags = `"${v.tags.join(', ').replace(/"/g, '""')}"`;
    const type = v.isShort ? "Shorts" : "Video";

    return [
      index + 1,
      safeTitle,
      v.id,
      `https://www.youtube.com/watch?v=${v.id}`,
      v.durationFormatted,
      new Date(v.publishedAtDate).toLocaleDateString(),
      v.viewCountRaw,
      v.likeCountRaw,
      v.commentCountRaw,
      v.engagementRate.toFixed(2),
      safeTags,
      type
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const saveAs = window.saveAs;
  if (saveAs) {
    saveAs(blob, `${filename}_Report.csv`);
  } else {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToExcel = (videos: VideoItem[], filename: string) => {
  const XLSX = window.XLSX;
  if (!XLSX) {
    console.error("SheetJS not loaded");
    return;
  }

  const data = videos.map((v, idx) => ({
    "No": idx + 1,
    "Title": v.title,
    "URL": `https://www.youtube.com/watch?v=${v.id}`,
    "Views": v.viewCountRaw,
    "Likes": v.likeCountRaw,
    "Comments": v.commentCountRaw,
    "Engagement Rate %": v.engagementRate,
    "Duration": v.durationFormatted,
    "Published": new Date(v.publishedAtDate).toLocaleDateString(),
    "Type": v.isShort ? "Shorts" : "Long",
    "Channel": v.channelTitle
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Analysis");

  XLSX.writeFile(workbook, `${filename}_Analysis.xlsx`);
};
