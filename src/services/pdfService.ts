// PDF Report Generator Service - Comprehensive reports with thumbnails

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

// Fetch thumbnail as base64 for PDF embedding
const fetchThumbnailAsBase64 = async (url: string): Promise<string | null> => {
  try {
    // Use a proxy or direct fetch - YouTube thumbnails should work
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Failed to fetch thumbnail:', e);
    return null;
  }
};

const addHeader = (doc: jsPDF, title: string, pageNum: number) => {
  doc.setFillColor(239, 68, 68); // Red accent
  doc.rect(0, 0, 210, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('YT ANALYZER PRO', 15, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 195, 15, { align: 'right' });
  
  // Page number
  doc.setFontSize(8);
  doc.text(`Page ${pageNum}`, 195, 290, { align: 'right' });
};

const addSection = (doc: jsPDF, title: string, y: number): number => {
  doc.setFillColor(245, 245, 245);
  doc.rect(15, y, 180, 8, 'F');
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 20, y + 5.5);
  return y + 15;
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

export const generatePDFReport = async (data: ReportData): Promise<void> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let currentY = 35;
  let currentPage = 1;

  // Calculate scores for all videos
  const scoredVideos = calculateAllVideoScores(data.videos);
  const { avgTitleScore, avgThumbnailScore } = getAverageScores(data.videos);

  const checkPageBreak = (neededSpace: number) => {
    if (currentY + neededSpace > 270) {
      doc.addPage();
      currentPage++;
      addHeader(doc, 'Channel Analysis Report', currentPage);
      currentY = 35;
    }
  };

  // === PAGE 1: Cover & Overview ===
  addHeader(doc, 'Channel Analysis Report', currentPage);

  // Channel Title
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.channelTitle || 'Channel Analysis', 15, currentY + 10);
  currentY += 20;

  // Generation Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${data.generatedAt.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 15, currentY);
  currentY += 15;

  // === Channel Stats Section ===
  if (data.channelStats) {
    currentY = addSection(doc, 'Channel Statistics', currentY);
    
    const stats = [
      { label: 'Subscribers', value: data.channelStats.subscriberCount },
      { label: 'Total Views', value: data.channelStats.viewCount },
      { label: 'Video Count', value: data.channelStats.videoCount },
    ];

    const boxWidth = 55;
    stats.forEach((stat, i) => {
      const x = 15 + (i * (boxWidth + 5));
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(x, currentY, boxWidth, 25, 3, 3, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(stat.label.toUpperCase(), x + 5, currentY + 8);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'bold');
      doc.text(stat.value, x + 5, currentY + 18);
    });
    currentY += 35;
  }

  // === Analysis Summary Section ===
  currentY = addSection(doc, 'Analysis Summary', currentY);
  
  const totalViews = data.videos.reduce((sum, v) => sum + v.viewCountRaw, 0);
  const totalLikes = data.videos.reduce((sum, v) => sum + v.likeCountRaw, 0);
  const avgER = data.videos.length > 0 
    ? (data.videos.reduce((sum, v) => sum + v.engagementRate, 0) / data.videos.length).toFixed(2)
    : '0';
  const shortsCount = data.videos.filter(v => v.isShort).length;
  const longCount = data.videos.length - shortsCount;

  const summaryStats = [
    { label: 'Videos Analyzed', value: data.videos.length.toString() },
    { label: 'Total Views', value: formatNumber(totalViews) },
    { label: 'Total Likes', value: formatNumber(totalLikes) },
    { label: 'Average ER', value: `${avgER}%` },
    { label: 'Long Videos', value: longCount.toString() },
    { label: 'Shorts', value: shortsCount.toString() },
  ];

  doc.setFont('helvetica', 'normal');
  summaryStats.forEach((stat, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const x = 15 + (col * 60);
    const y = currentY + (row * 12);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(stat.label, x, y);
    
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, x, y + 6);
    doc.setFont('helvetica', 'normal');
  });
  currentY += 35;

  // === Performance Scores Summary ===
  currentY = addSection(doc, 'Performance Scores', currentY);
  
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(`Average Title Score: ${avgTitleScore}/100`, 20, currentY);
  doc.text(`Average Thumbnail Score: ${avgThumbnailScore}/100`, 100, currentY);
  currentY += 15;

  // === Top 20 Performing Videos with Thumbnails ===
  checkPageBreak(100);
  currentY = addSection(doc, 'Top 20 Performing Videos', currentY);

  const topVideos = [...scoredVideos]
    .sort((a, b) => b.viewCountRaw - a.viewCountRaw)
    .slice(0, 20);

  // Fetch thumbnails in parallel (limit to first 10 for performance)
  const thumbnailPromises = topVideos.slice(0, 10).map(v => fetchThumbnailAsBase64(v.thumbnail));
  const thumbnailImages = await Promise.all(thumbnailPromises);

  for (let i = 0; i < topVideos.length; i++) {
    const video = topVideos[i];
    checkPageBreak(35);
    
    const y = currentY;
    const hasImage = i < 10 && thumbnailImages[i];
    
    // Video number
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(239, 68, 68);
    doc.text(`#${i + 1}`, 15, y + 8);
    
    // Thumbnail image (if available)
    if (hasImage && thumbnailImages[i]) {
      try {
        doc.addImage(thumbnailImages[i]!, 'JPEG', 25, y, 32, 18);
      } catch (e) {
        // Draw placeholder
        doc.setFillColor(240, 240, 240);
        doc.rect(25, y, 32, 18, 'F');
      }
    } else {
      // Draw placeholder rectangle
      doc.setFillColor(240, 240, 240);
      doc.rect(25, y, 32, 18, 'F');
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text('THUMBNAIL', 30, y + 10);
    }
    
    // Video info
    const infoX = 62;
    
    // Title (truncated)
    const maxTitleLength = 55;
    const title = video.title.length > maxTitleLength 
      ? video.title.substring(0, maxTitleLength) + '...'
      : video.title;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(title, infoX, y + 5);
    
    // Stats row
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Views: ${video.views} | Likes: ${video.likes} | ER: ${video.engagementRate}%`, infoX, y + 11);
    
    // Scores
    const titleGradeColor = getGradeColor(video.titleScore.grade);
    const thumbGradeColor = getGradeColor(video.thumbnailScore.grade);
    
    doc.setFontSize(7);
    doc.text(`Title Score: `, infoX, y + 17);
    doc.setTextColor(...titleGradeColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`${video.titleScore.totalScore} (${video.titleScore.grade})`, infoX + 20, y + 17);
    
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`| Thumb Score: `, infoX + 40, y + 17);
    doc.setTextColor(...thumbGradeColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`${video.thumbnailScore.totalScore} (${video.thumbnailScore.grade})`, infoX + 62, y + 17);
    
    currentY += 22;
  }

  currentY += 10;

  // === Engagement Distribution ===
  checkPageBreak(60);
  currentY = addSection(doc, 'Engagement Rate Distribution', currentY);

  const erRanges = [
    { label: '0-2% (Low)', count: data.videos.filter(v => v.engagementRate < 2).length },
    { label: '2-5% (Medium)', count: data.videos.filter(v => v.engagementRate >= 2 && v.engagementRate < 5).length },
    { label: '5-10% (Good)', count: data.videos.filter(v => v.engagementRate >= 5 && v.engagementRate < 10).length },
    { label: '10%+ (Excellent)', count: data.videos.filter(v => v.engagementRate >= 10).length },
  ];

  const maxCount = Math.max(...erRanges.map(r => r.count), 1);
  
  erRanges.forEach((range, i) => {
    const y = currentY + (i * 12);
    const barWidth = (range.count / maxCount) * 120;
    
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(range.label, 15, y + 4);
    
    doc.setFillColor(239, 68, 68);
    doc.roundedRect(60, y, barWidth, 6, 1, 1, 'F');
    
    doc.setTextColor(30, 30, 30);
    doc.text(range.count.toString(), 65 + barWidth, y + 4);
  });

  currentY += 60;

  // === Top Tags ===
  checkPageBreak(50);
  currentY = addSection(doc, 'Most Used Tags', currentY);

  const tagCounts = new Map<string, number>();
  data.videos.forEach(v => {
    v.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  doc.setFontSize(9);
  let tagX = 15;
  let tagY = currentY;
  
  topTags.forEach((tag) => {
    const tagText = `${tag[0]} (${tag[1]})`;
    const tagWidth = doc.getTextWidth(tagText) + 6;
    
    if (tagX + tagWidth > 190) {
      tagX = 15;
      tagY += 8;
    }
    
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(tagX, tagY - 4, tagWidth, 7, 2, 2, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text(tagText, tagX + 3, tagY);
    tagX += tagWidth + 3;
  });

  // === Footer ===
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated by YT Analyzer Pro', 15, 290);

  // Save
  const fileName = `${data.channelTitle?.replace(/[^a-zA-Z0-9]/g, '_') || 'channel'}_report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const generateQuickReport = async (videos: VideoItem[], title: string): Promise<void> => {
  await generatePDFReport({
    channelTitle: title,
    videos,
    generatedAt: new Date()
  });
};
