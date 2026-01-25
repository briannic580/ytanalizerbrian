import React, { useState } from 'react';
import { ChannelStats } from '../types';
import { fetchChannelInfo } from '../services/youtubeService';
import { IconChart } from '../constants/icons';

interface BenchmarkProps {
  apiKey: string;
}

const CompetitorBenchmark: React.FC<BenchmarkProps> = ({ apiKey }) => {
  const [ch1Query, setCh1Query] = useState('');
  const [ch2Query, setCh2Query] = useState('');
  const [ch1, setCh1] = useState<ChannelStats | null>(null);
  const [ch2, setCh2] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const id1 = ch1Query.split('/').pop()?.replace('@', '') || '';
      const id2 = ch2Query.split('/').pop()?.replace('@', '') || '';

      const [s1, s2] = await Promise.all([
        fetchChannelInfo(apiKey, id1),
        fetchChannelInfo(apiKey, id2)
      ]);
      setCh1(s1 || null);
      setCh2(s2 || null);
    } finally {
      setLoading(false);
    }
  };

  const MetricRow = ({ label, v1, v2, higherIsBetter = true }: { label: string, v1: number, v2: number, higherIsBetter?: boolean }) => {
    const isV1Better = higherIsBetter ? v1 > v2 : v1 < v2;
    return (
      <div className="grid grid-cols-3 py-4 border-b border-border">
        <div className={`text-center font-bold text-lg transition-colors duration-300 ${isV1Better ? 'text-primary' : 'text-muted-foreground'}`}>
          {v1.toLocaleString()}
        </div>
        <div className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          {label}
        </div>
        <div className={`text-center font-bold text-lg transition-colors duration-300 ${!isV1Better ? 'text-primary' : 'text-muted-foreground'}`}>
          {v2.toLocaleString()}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row gap-4">
        <input 
          value={ch1Query} 
          onChange={e => setCh1Query(e.target.value)} 
          placeholder="Channel 1 ID or Handle" 
          className="flex-1 bg-card border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 ring-primary/20 outline-none transition-all duration-300" 
        />
        <div className="flex items-center justify-center font-black text-muted-foreground">VS</div>
        <input 
          value={ch2Query} 
          onChange={e => setCh2Query(e.target.value)} 
          placeholder="Channel 2 ID or Handle" 
          className="flex-1 bg-card border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 ring-primary/20 outline-none transition-all duration-300" 
        />
        <button 
          onClick={handleCompare} 
          disabled={loading}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all duration-300 active:scale-95 disabled:opacity-50"
        >
          <IconChart className="w-4 h-4" /> 
          {loading ? 'Loading...' : 'Compare'}
        </button>
      </div>

      {ch1 && ch2 && (
        <div className="bg-card rounded-3xl p-8 border border-border shadow-premium animate-scale-in">
          <div className="grid grid-cols-3 mb-10">
            <div className="flex flex-col items-center gap-3">
              <img src={ch1.avatar} className="w-20 h-20 rounded-full border-4 border-primary/20" alt="Channel A" />
              <span className="font-black text-foreground">Channel A</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="px-4 py-1 bg-secondary rounded-full text-[10px] font-black text-muted-foreground">
                BENCHMARK
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <img src={ch2.avatar} className="w-20 h-20 rounded-full border-4 border-primary/20" alt="Channel B" />
              <span className="font-black text-foreground">Channel B</span>
            </div>
          </div>

          <MetricRow label="Subscribers" v1={ch1.subCountRaw} v2={ch2.subCountRaw} />
          <MetricRow label="Total Views" v1={parseInt(ch1.viewCount.replace(/[^0-9]/g, ''))} v2={parseInt(ch2.viewCount.replace(/[^0-9]/g, ''))} />
          <MetricRow label="Video Count" v1={parseInt(ch1.videoCount.replace(/[^0-9]/g, ''))} v2={parseInt(ch2.videoCount.replace(/[^0-9]/g, ''))} />
        </div>
      )}

      {!ch1 && !ch2 && (
        <div className="text-center py-20 text-muted-foreground font-medium italic">
          Masukkan Channel ID untuk membandingkan performa
        </div>
      )}
    </div>
  );
};

export default CompetitorBenchmark;
