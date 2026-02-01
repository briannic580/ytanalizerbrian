// PDF Report Generator Service - Comprehensive reports with ALL data & thumbnails
// NOTE: jsPDF does not support Unicode emojis, so we use plain text labels instead

import jsPDF from 'jspdf';
import { VideoItem, ChannelStats } from '../types';
import { formatNumber } from './youtubeService';
import { calculateAllVideoScores, getAverageScores, VideoWithScores } from './performanceScoreService';

interface ReportData {
  channelTitle: string;
  channelStats?: ChannelStats;
  videos: VideoItem[];
  generatedAt: Date;
}

// Fetch thumbnail as base64 for PDF embedding with timeout
const fetchThumbnailAsBase64 = async (url: string, timeout = 5000): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Failed to fetch thumbnail:', url);
    return null;
  }
};

// Batch fetch thumbnails for better performance
const fetchThumbnailsBatch = async (videos: VideoItem[], batchSize = 5): Promise<Map<string, string>> => {
  const thumbnailMap = new Map<string, string>();
  
  for (let i = 0; i < videos.length; i += batchSize) {
    const batch = videos.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (video) => {
        const base64 = await fetchThumbnailAsBase64(video.thumbnail);
        return { id: video.id, base64 };
      })
    );
    
    results.forEach(({ id, base64 }) => {
      if (base64) {
        thumbnailMap.set(id, base64);
      }
    });
    
    console.log(`Fetched thumbnails: ${Math.min(i + batchSize, videos.length)}/${videos.length}`);
  }
  
  return thumbnailMap;
};

const addHeader = (doc: jsPDF, title: string, pageNum: number, totalPages?: number) => {
  doc.setFillColor(239, 68, 68); // Red accent
  doc.rect(0, 0, 210, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('YT ANALYZER PRO', 15, 13);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 195, 13, { align: 'right' });
  
  // Page number at bottom
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const pageText = totalPages ? `Page ${pageNum} of ${totalPages}` : `Page ${pageNum}`;
  doc.text(pageText, 195, 290, { align: 'right' });
};

const addSection = (doc: jsPDF, title: string, y: number): number => {
  doc.setFillColor(245, 245, 245);
  doc.rect(15, y, 180, 8, 'F');
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 20, y + 5.5);
  return y + 12;
};

const getGradeColor = (grade: string): [number, number, number] => {
  switch (grade) {
    case 'A': return [16, 185, 129]; // emerald
    case 'B': return [59, 130, 246]; // blue
    case 'C': return [234, 179, 8]; // yellow
    case 'D': return [249, 115, 22]; // orange
    default: return [239, 68, 68]; // red
  }
};

const getGrade = (score: number): string => {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
};

export const generatePDFReport = async (data: ReportData): Promise<void> => {
  console.log('Starting PDF generation...');
  const doc = new jsPDF('p', 'mm', 'a4');
  let currentY = 30;
  let currentPage = 1;

  // Limit videos for PDF (max 100 for file size)
  const maxVideos = Math.min(data.videos.length, 100);
  const videosForPDF = data.videos.slice(0, maxVideos);

  // Calculate scores for all videos
  const scoredVideos = calculateAllVideoScores(videosForPDF);
  const { avgTitleScore, avgThumbnailScore } = getAverageScores(videosForPDF);

  // Fetch ALL thumbnails (batched)
  console.log('Fetching thumbnails...');
  const thumbnailMap = await fetchThumbnailsBatch(videosForPDF, 5);
  console.log(`Fetched ${thumbnailMap.size} thumbnails successfully`);

  // Calculate statistics
  const totalViews = data.videos.reduce((sum, v) => sum + v.viewCountRaw, 0);
  const totalLikes = data.videos.reduce((sum, v) => sum + v.likeCountRaw, 0);
  const totalComments = data.videos.reduce((sum, v) => sum + (v.commentCountRaw || 0), 0);
  const avgER = data.videos.length > 0 
    ? (data.videos.reduce((sum, v) => sum + v.engagementRate, 0) / data.videos.length)
    : 0;
  const shortsCount = data.videos.filter(v => v.isShort).length;
  const longCount = data.videos.length - shortsCount;
  const outliersCount = data.videos.filter(v => v.isOutlier).length;

  // ER Distribution
  const erDistribution = {
    low: data.videos.filter(v => v.engagementRate < 2).length,
    medium: data.videos.filter(v => v.engagementRate >= 2 && v.engagementRate < 5).length,
    good: data.videos.filter(v => v.engagementRate >= 5 && v.engagementRate < 10).length,
    excellent: data.videos.filter(v => v.engagementRate >= 10).length,
  };

  // Top tags
  const tagCounts = new Map<string, number>();
  data.videos.forEach(v => {
    v.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  // Estimate total pages
  const videosPerPage = 5;
  const videoCatalogPages = Math.ceil(videosForPDF.length / videosPerPage);
  const totalPages = 2 + videoCatalogPages; // Cover + Summary + Video pages

  // ========== PAGE 1: COVER ==========
  addHeader(doc, 'Channel Analysis Report', currentPage, totalPages);
  
  // Big channel title
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  const channelName = data.channelTitle || 'Channel Analysis';
  doc.text(channelName.length > 35 ? channelName.substring(0, 35) + '...' : channelName, 105, 55, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Comprehensive YouTube Analytics Report', 105, 65, { align: 'center' });

  // Channel stats boxes
  if (data.channelStats) {
    currentY = 85;
    const boxWidth = 55;
    const stats = [
      { label: 'SUBSCRIBERS', value: data.channelStats.subscriberCount },
      { label: 'TOTAL VIEWS', value: data.channelStats.viewCount },
      { label: 'VIDEOS', value: data.channelStats.videoCount },
    ];

    stats.forEach((stat, i) => {
      const x = 15 + (i * (boxWidth + 5));
      
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(x, currentY, boxWidth, 35, 3, 3, 'F');
      doc.setDrawColor(230, 230, 230);
      doc.roundedRect(x, currentY, boxWidth, 35, 3, 3, 'S');
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(stat.label, x + boxWidth/2, currentY + 10, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'bold');
      doc.text(stat.value, x + boxWidth/2, currentY + 24, { align: 'center' });
    });
    currentY += 50;
  } else {
    currentY = 85;
  }

  // Report info
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(30, currentY, 150, 25, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`Videos Analyzed: ${data.videos.length}`, 105, currentY + 10, { align: 'center' });
  doc.text(`Generated: ${data.generatedAt.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 105, currentY + 18, { align: 'center' });

  // Report ID
  const reportId = `RPT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(new Date().getHours()).padStart(2, '0')}${String(new Date().getMinutes()).padStart(2, '0')}`;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Report ID: ${reportId}`, 105, 280, { align: 'center' });

  // ========== PAGE 2: EXECUTIVE SUMMARY ==========
  doc.addPage();
  currentPage++;
  addHeader(doc, 'Executive Summary', currentPage, totalPages);
  currentY = 30;

  // Analysis Overview Section
  currentY = addSection(doc, 'Analysis Overview', currentY);
  
  const overviewStats = [
    { label: 'Videos Analyzed', value: data.videos.length.toString() },
    { label: 'Total Views', value: formatNumber(totalViews) },
    { label: 'Total Likes', value: formatNumber(totalLikes) },
    { label: 'Total Comments', value: formatNumber(totalComments) },
    { label: 'Average ER', value: `${avgER.toFixed(2)}%` },
    { label: 'Outlier Videos', value: outliersCount.toString() },
  ];

  doc.setFont('helvetica', 'normal');
  overviewStats.forEach((stat, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const x = 20 + (col * 60);
    const y = currentY + (row * 14);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(stat.label, x, y);
    
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, x, y + 7);
    doc.setFont('helvetica', 'normal');
  });
  currentY += 40;

  // Content Breakdown Section
  currentY = addSection(doc, 'Content Breakdown', currentY);
  
  const longPercent = data.videos.length > 0 ? (longCount / data.videos.length * 100).toFixed(0) : '0';
  const shortsPercent = data.videos.length > 0 ? (shortsCount / data.videos.length * 100).toFixed(0) : '0';
  
  // Long videos bar
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Long Videos: ${longCount} (${longPercent}%)`, 20, currentY + 5);
  doc.setFillColor(59, 130, 246);
  const longBarWidth = Math.max((longCount / Math.max(data.videos.length, 1)) * 100, 2);
  doc.roundedRect(90, currentY, longBarWidth, 6, 1, 1, 'F');
  
  // Shorts bar
  doc.text(`Shorts: ${shortsCount} (${shortsPercent}%)`, 20, currentY + 16);
  doc.setFillColor(168, 85, 247);
  const shortsBarWidth = Math.max((shortsCount / Math.max(data.videos.length, 1)) * 100, 2);
  doc.roundedRect(90, currentY + 11, shortsBarWidth, 6, 1, 1, 'F');
  
  currentY += 30;

  // Performance Scores Section
  currentY = addSection(doc, 'Performance Scores', currentY);
  
  const titleGrade = getGrade(avgTitleScore);
  const thumbGrade = getGrade(avgThumbnailScore);
  
  // Title Score box
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(20, currentY, 80, 25, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('AVG TITLE SCORE', 60, currentY + 7, { align: 'center' });
  doc.setFontSize(16);
  const [tr, tg, tb] = getGradeColor(titleGrade);
  doc.setTextColor(tr, tg, tb);
  doc.setFont('helvetica', 'bold');
  doc.text(`${avgTitleScore}/100 (${titleGrade})`, 60, currentY + 19, { align: 'center' });
  
  // Thumbnail Score box
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(110, currentY, 80, 25, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('AVG THUMBNAIL SCORE', 150, currentY + 7, { align: 'center' });
  doc.setFontSize(16);
  const [thr, thg, thb] = getGradeColor(thumbGrade);
  doc.setTextColor(thr, thg, thb);
  doc.setFont('helvetica', 'bold');
  doc.text(`${avgThumbnailScore}/100 (${thumbGrade})`, 150, currentY + 19, { align: 'center' });
  
  currentY += 35;

  // Engagement Rate Distribution Section
  currentY = addSection(doc, 'Engagement Rate Distribution', currentY);
  
  const erRanges = [
    { label: '0-2% (Low)', count: erDistribution.low, color: [239, 68, 68] as [number, number, number] },
    { label: '2-5% (Medium)', count: erDistribution.medium, color: [234, 179, 8] as [number, number, number] },
    { label: '5-10% (Good)', count: erDistribution.good, color: [59, 130, 246] as [number, number, number] },
    { label: '10%+ (Excellent)', count: erDistribution.excellent, color: [16, 185, 129] as [number, number, number] },
  ];

  const maxERCount = Math.max(...erRanges.map(r => r.count), 1);
  
  erRanges.forEach((range, i) => {
    const y = currentY + (i * 10);
    const barWidth = Math.max((range.count / maxERCount) * 80, 2);
    
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(range.label, 20, y + 4);
    
    doc.setFillColor(...range.color);
    doc.roundedRect(70, y, barWidth, 5, 1, 1, 'F');
    
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(`${range.count}`, 75 + barWidth, y + 4);
    doc.setFont('helvetica', 'normal');
  });

  currentY += 50;

  // Top Tags Section
  currentY = addSection(doc, 'Most Used Tags (Top 15)', currentY);
  
  doc.setFontSize(8);
  let tagX = 20;
  let tagY = currentY;
  
  topTags.forEach((tag) => {
    const tagText = `${tag[0]} (${tag[1]})`;
    const tagWidth = doc.getTextWidth(tagText) + 6;
    
    if (tagX + tagWidth > 190) {
      tagX = 20;
      tagY += 8;
    }
    
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(tagX, tagY - 4, tagWidth, 7, 2, 2, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text(tagText, tagX + 3, tagY);
    tagX += tagWidth + 3;
  });

  // ========== VIDEO CATALOG PAGES ==========
  const sortedVideos = [...scoredVideos].sort((a, b) => b.viewCountRaw - a.viewCountRaw);
  
  for (let i = 0; i < sortedVideos.length; i++) {
    // New page every 5 videos
    if (i % videosPerPage === 0) {
      doc.addPage();
      currentPage++;
      addHeader(doc, `Video Catalog (${i + 1}-${Math.min(i + videosPerPage, sortedVideos.length)} of ${sortedVideos.length})`, currentPage, totalPages);
      currentY = 28;
    }

    const video = sortedVideos[i];
    const thumbnailBase64 = thumbnailMap.get(video.id);
    
    // Video entry box
    const entryHeight = 48;
    
    if (currentY + entryHeight > 275) {
      doc.addPage();
      currentPage++;
      addHeader(doc, `Video Catalog`, currentPage, totalPages);
      currentY = 28;
    }

    // Light background for video entry
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(15, currentY, 180, entryHeight, 2, 2, 'F');
    doc.setDrawColor(240, 240, 240);
    doc.roundedRect(15, currentY, 180, entryHeight, 2, 2, 'S');

    // Video number
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(239, 68, 68);
    doc.text(`#${i + 1}`, 20, currentY + 8);

    // Thumbnail
    const thumbX = 32;
    const thumbY = currentY + 3;
    const thumbW = 45;
    const thumbH = 25;
    
    if (thumbnailBase64) {
      try {
        doc.addImage(thumbnailBase64, 'JPEG', thumbX, thumbY, thumbW, thumbH);
      } catch (e) {
        doc.setFillColor(230, 230, 230);
        doc.rect(thumbX, thumbY, thumbW, thumbH, 'F');
      }
    } else {
      doc.setFillColor(230, 230, 230);
      doc.rect(thumbX, thumbY, thumbW, thumbH, 'F');
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text('NO IMAGE', thumbX + thumbW/2, thumbY + thumbH/2, { align: 'center' });
    }

    // Badges (SHORT, OUTLIER) - Using plain text, no emojis
    let badgeX = thumbX;
    if (video.isShort) {
      doc.setFillColor(168, 85, 247);
      doc.roundedRect(badgeX, thumbY + thumbH + 1, 16, 5, 1, 1, 'F');
      doc.setFontSize(5);
      doc.setTextColor(255, 255, 255);
      doc.text('SHORT', badgeX + 8, thumbY + thumbH + 4.5, { align: 'center' });
      badgeX += 18;
    }
    if (video.isOutlier) {
      doc.setFillColor(249, 115, 22);
      doc.roundedRect(badgeX, thumbY + thumbH + 1, 18, 5, 1, 1, 'F');
      doc.setFontSize(5);
      doc.setTextColor(255, 255, 255);
      doc.text('OUTLIER', badgeX + 9, thumbY + thumbH + 4.5, { align: 'center' });
    }

    // Video info - right side
    const infoX = thumbX + thumbW + 5;
    
    // Title (2 lines max)
    const maxTitleLength = 60;
    const title = video.title.length > maxTitleLength 
      ? video.title.substring(0, maxTitleLength) + '...'
      : video.title;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    
    // Split title if too long
    const titleLines = doc.splitTextToSize(title, 110);
    doc.text(titleLines.slice(0, 2), infoX, currentY + 7);
    
    // Stats row 1: Views, Likes, Comments - Plain text labels (NO EMOJIS)
    const statsY = currentY + (titleLines.length > 1 ? 18 : 14);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Views: ${video.views}  |  Likes: ${video.likes}  |  Comments: ${video.comments || '0'}`, infoX, statsY);
    
    // Stats row 2: ER, Duration, Published - Plain text labels (NO EMOJIS)
    doc.text(`ER: ${video.engagementRate}%  |  Duration: ${video.durationFormatted}  |  Published: ${video.publishedTimeAgo}`, infoX, statsY + 6);
    
    // Scores row
    const scoresY = statsY + 12;
    doc.setFontSize(7);
    
    // Title score
    doc.setTextColor(80, 80, 80);
    doc.text('Title: ', infoX, scoresY);
    const [tsr, tsg, tsb] = getGradeColor(video.titleScore.grade);
    doc.setTextColor(tsr, tsg, tsb);
    doc.setFont('helvetica', 'bold');
    doc.text(`${video.titleScore.totalScore} (${video.titleScore.grade})`, infoX + 12, scoresY);
    
    // Thumbnail score
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text('  |  Thumb: ', infoX + 30, scoresY);
    const [ths, thsg, thsb] = getGradeColor(video.thumbnailScore.grade);
    doc.setTextColor(ths, thsg, thsb);
    doc.setFont('helvetica', 'bold');
    doc.text(`${video.thumbnailScore.totalScore} (${video.thumbnailScore.grade})`, infoX + 52, scoresY);

    // Tags (top 5)
    if (video.tags && video.tags.length > 0) {
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      const tagsText = video.tags.slice(0, 5).join(', ');
      const truncatedTags = tagsText.length > 50 ? tagsText.substring(0, 50) + '...' : tagsText;
      doc.text(`Tags: ${truncatedTags}`, infoX, scoresY + 6);
    }

    currentY += entryHeight + 2;
  }

  // ========== FINAL PAGE: FOOTER ==========
  doc.addPage();
  currentPage++;
  addHeader(doc, 'Report Summary', currentPage, totalPages);

  // Centered summary
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Complete', 105, 100, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Total Videos Analyzed: ${data.videos.length}`, 105, 115, { align: 'center' });
  doc.text(`Videos in This Report: ${videosForPDF.length}`, 105, 125, { align: 'center' });
  doc.text(`Total Pages: ${totalPages}`, 105, 135, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${data.generatedAt.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 105, 150, { align: 'center' });

  // Thank you note
  doc.setFillColor(239, 68, 68);
  doc.roundedRect(55, 170, 100, 30, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank You!', 105, 183, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by YT Analyzer Pro', 105, 192, { align: 'center' });

  // URL
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text('https://ytanalizerbrian.lovable.app', 105, 220, { align: 'center' });
  
  doc.text(`Report ID: ${reportId}`, 105, 230, { align: 'center' });

  // ========== SAVE ==========
  const fileName = `${data.channelTitle?.replace(/[^a-zA-Z0-9]/g, '_') || 'channel'}_comprehensive_report_${new Date().toISOString().split('T')[0]}.pdf`;
  console.log(`Saving PDF: ${fileName}`);
  doc.save(fileName);
  console.log('PDF saved successfully!');
};

export const generateQuickReport = async (videos: VideoItem[], title: string): Promise<void> => {
  await generatePDFReport({
    channelTitle: title,
    videos,
    generatedAt: new Date()
  });
};
