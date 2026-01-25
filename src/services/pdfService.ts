// PDF Report Generator Service

import jsPDF from 'jspdf';
import { VideoItem, ChannelStats } from '../types';
import { formatNumber } from './youtubeService';

interface ReportData {
  channelTitle: string;
  channelStats?: ChannelStats;
  videos: VideoItem[];
  generatedAt: Date;
}

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

export const generatePDFReport = async (data: ReportData): Promise<void> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let currentY = 35;
  let currentPage = 1;

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

  // === Videos Analyzed Section ===
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

  // === Top 10 Performing Videos ===
  checkPageBreak(100);
  currentY = addSection(doc, 'Top 10 Performing Videos', currentY);

  const topVideos = [...data.videos]
    .sort((a, b) => b.viewCountRaw - a.viewCountRaw)
    .slice(0, 10);

  // Table Header
  doc.setFillColor(245, 245, 245);
  doc.rect(15, currentY, 180, 8, 'F');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('#', 18, currentY + 5);
  doc.text('Title', 25, currentY + 5);
  doc.text('Views', 130, currentY + 5);
  doc.text('Likes', 155, currentY + 5);
  doc.text('ER%', 178, currentY + 5);
  currentY += 10;

  topVideos.forEach((video, i) => {
    checkPageBreak(10);
    
    const y = currentY;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text((i + 1).toString(), 18, y);
    
    // Truncate title
    const maxTitleLength = 50;
    const title = video.title.length > maxTitleLength 
      ? video.title.substring(0, maxTitleLength) + '...'
      : video.title;
    doc.setTextColor(30, 30, 30);
    doc.text(title, 25, y);
    
    doc.setTextColor(80, 80, 80);
    doc.text(video.views, 130, y);
    doc.text(video.likes, 155, y);
    doc.text(`${video.engagementRate}%`, 178, y);
    
    currentY += 8;
  });

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
