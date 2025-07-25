<template>
  <div class="comparison-result">
    <AICard variant="gradient" :glow="true" class="result-overview">
      <template #header>
        <div class="overview-header">
          <h2>分析结果</h2>
          <el-tag size="large" :type="getQualityType(bestScore)">
            {{ getQualityLabel(bestScore) }}
          </el-tag>
        </div>
      </template>

      <div v-if="result.best_match" class="best-match">
        <div class="best-match__icon">
          <el-icon :size="64"><Trophy /></el-icon>
        </div>
        <div class="best-match__info">
          <h3>最佳匹配预报</h3>
          <div class="best-match__value">{{ result.best_match }}</div>
          <div class="best-match__score">
            综合得分：<animated-number :value="bestScore * 100" :decimals="2" />%
          </div>
        </div>
      </div>

      <div class="model-info" v-if="details.model_info">
        <el-icon><Cpu /></el-icon>
        <span>使用模型：{{ details.model_info.name }}</span>
        <el-tooltip :content="details.model_info.description" placement="top">
          <el-icon><InfoFilled /></el-icon>
        </el-tooltip>
      </div>
    </AICard>

    <div class="metrics-grid">
      <MetricCard
          v-for="metric in keyMetrics"
          :key="metric.key"
          :label="metric.label"
          :value="metric.value"
          :icon="metric.icon"
          :type="metric.type"
          suffix="%"
          :decimals="2"
          :tooltip="metric.tooltip"
      />
    </div>

    <AICard title="详细分析" icon="DataAnalysis" class="detailed-analysis">
      <div class="analysis-process" v-if="details.analysis_process">
        <h4>分析过程</h4>
        <el-timeline>
          <el-timeline-item
              v-for="(step, index) in details.analysis_process.steps"
              :key="index"
              :icon="getStepIcon(step.name)"
              type="success"
          >
            <div class="timeline-content">
              <h5>{{ step.name }}</h5>
              <p>{{ step.description }} (耗时: {{ step.duration_ms }}ms)</p>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <div class="comparison-charts">
        <h4>各时段对比分析</h4>
        <DataVisualization
            type="radar"
            :data="radarData"
            :height="400"
        />
      </div>

      <div class="score-details">
        <h4>得分详情</h4>
        <el-table :data="scoreTableData" style="width: 100%">
          <el-table-column prop="forecast_type" label="预报时段" width="120">
            <template #default="{ row }">
              <el-tag>{{ row.forecast_type }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column
              v-for="col in scoreColumns"
              :key="col.prop"
              :prop="col.prop"
              :label="col.label"
          >
            <template #header>
              <div class="column-header">
                <span>{{ col.label }}</span>
                <el-tooltip :content="details.score_explanations[col.prop]" placement="top">
                  <el-icon><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <template #default="{ row }">
              <div class="score-cell">
                <el-progress
                    :percentage="(row[col.prop] || 0) * 100"
                    :color="getScoreColor(row[col.prop] || 0)"
                />
                <span class="score-value">{{ ((row[col.prop] || 0) * 100).toFixed(2) }}%</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </AICard>

    <AICard title="结果解释" icon="Document" class="result-explanation">
      <div class="explanation-content" v-if="details.analysis_explanation">
        <h4>为什么是这个结果？</h4>
        <div class="reason-cards">
          <div
              v-for="(finding, index) in details.analysis_explanation.key_findings"
              :key="index"
              class="reason-card"
          >
            <div class="reason-icon">
              <el-icon :size="32"><component :is="getFindingIcon(finding.type)" /></el-icon>
            </div>
            <div class="reason-content">
              <h5>{{ finding.title }}</h5>
              <p>{{ finding.content }}</p>
            </div>
          </div>
          <el-empty v-if="!details.analysis_explanation.key_findings || details.analysis_explanation.key_findings.length === 0" description="暂无AI分析摘要" />
        </div>

        <div class="recommendations" v-if="details.improvement_suggestions">
          <h4>改进建议</h4>
          <el-alert
              v-for="(suggestion, index) in details.improvement_suggestions"
              :key="index"
              :title="suggestion"
              type="info"
              :closable="false"
              show-icon
          />
          <el-empty v-if="!details.improvement_suggestions || details.improvement_suggestions.length === 0" description="预报质量良好，暂无改进建议" />
        </div>
      </div>
    </AICard>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Trophy, Cpu, InfoFilled, DataAnalysis,
  QuestionFilled, Document, Grid, Histogram, Location, Aim,
  Picture as IconPicture, Filter, MagicStick, CircleCheck
} from '@element-plus/icons-vue'
import AICard from '@/modules/common/components/AICard.vue'
import MetricCard from '@/modules/common/components/MetricCard.vue'
import DataVisualization from '@/modules/common/components/DataVisualization.vue'
import AnimatedNumber from '@/modules/common/components/AnimatedNumber.vue'

const props = defineProps<{
  result: any;      // 基础结果对象
  taskInfo: any;    // 基础任务信息对象
  details: any;     // 后端返回的详细分析对象
}>();

// --- 所有复杂的 computed 都被简化或移除，直接从 props.details 获取数据 ---

const bestMatchScore = computed(() => {
  if (!props.result || !Array.isArray(props.result.scores)) return null;
  return props.result.scores.find(
      (s: any) => s.forecast_type === props.result.best_match
  );
});

const bestScore = computed(() => bestMatchScore.value?.total_score || 0);

const keyMetrics = computed(() => {
  const best = bestMatchScore.value;
  if (!best) return [];
  const modelUsed = props.taskInfo.model_used || 'traditional';

  if (modelUsed === 'rain_specific') {
    return [
      { key: 'coverage', label: '覆盖率相似度', value: (best.coverage_similarity || 0) * 100, icon: Grid, type: 'primary' },
      { key: 'intensity', label: '强度相似度', value: (best.intensity_similarity || 0) * 100, icon: Histogram, type: 'success' },
      { key: 'spatial', label: '空间相关性', value: (best.spatial_correlation || 0) * 100, icon: Location, type: 'warning' },
      { key: 'total', label: '综合得分', value: (best.total_score || 0) * 100, icon: Trophy, type: 'info' }
    ];
  } else {
    return [
      { key: 'ssim', label: 'SSIM得分', value: (best.ssim_score || 0) * 100, icon: IconPicture, type: 'primary' },
      { key: 'histogram', label: '直方图得分', value: (best.histogram_score || 0) * 100, icon: Histogram, type: 'success' },
      { key: 'feature', label: '特征得分', value: (best.feature_score || 0) * 100, icon: Aim, type: 'warning' },
      { key: 'total', label: '综合得分', value: (best.total_score || 0) * 100, icon: Trophy, type: 'info' }
    ];
  }
});


const radarData = computed(() => {
  if (!props.result || !Array.isArray(props.result.scores)) return { indicator: [], series: [] };
  const modelUsed = props.taskInfo.model_used || 'traditional';
  const indicators = modelUsed === 'rain_specific'
      ? [ { name: '覆盖率', max: 1 }, { name: '强度', max: 1 }, { name: '空间', max: 1 }, { name: '中心', max: 1 } ]
      : [ { name: 'SSIM', max: 1 }, { name: '直方图', max: 1 }, { name: '特征', max: 1 } ];

  const series = props.result.scores.map((score: any) => ({
    name: `${score.forecast_type}预报`,
    value: modelUsed === 'rain_specific_v1'
        ? [ score.coverage_similarity || 0, score.intensity_similarity || 0, score.spatial_correlation || 0, score.center_similarity || 0 ]
        : [ score.ssim_score || 0, score.histogram_score || 0, score.feature_score || 0 ]
  }));
  return { indicator: indicators, series };
});

const scoreTableData = computed(() => props.result.scores || []);

const scoreColumns = computed(() => {
  const modelUsed = props.taskInfo.model_used || 'traditional';
  if (modelUsed === 'rain_specific') {
    return [
      { prop: 'coverage_similarity', label: '覆盖率' },
      { prop: 'intensity_similarity', label: '强度分布' },
      { prop: 'spatial_correlation', label: '空间相关' },
      { prop: 'total_score', label: '综合得分' }
    ];
  } else {
    return [
      { prop: 'ssim_score', label: 'SSIM' },
      { prop: 'histogram_score', label: '直方图' },
      { prop: 'feature_score', label: '特征匹配' },
      { prop: 'total_score', label: '综合得分' }
    ];
  }
});

// 辅助函数
const getQualityType = (score: number) => {
  if (score >= 0.9) return 'success'; if (score >= 0.7) return 'primary'; if (score >= 0.5) return 'warning'; return 'danger';
};
const getQualityLabel = (score: number) => {
  if (score >= 0.9) return '优秀'; if (score >= 0.7) return '良好'; if (score >= 0.5) return '一般'; return '较差';
};
const getScoreColor = (score: number) => {
  if (score >= 0.8) return '#10b981'; if (score >= 0.6) return '#3b82f6'; if (score >= 0.4) return '#f59e0b'; return '#ef4444';
};
const getStepIcon = (name: string) => {
  const map: Record<string, any> = { '图像预处理': IconPicture, '特征提取': Filter, '相似度计算': MagicStick, '综合评分': CircleCheck };
  return map[name] || DataAnalysis;
}
const getFindingIcon = (type: string) => {
  const map: Record<string, any> = { 'primary': InfoFilled, 'success': CircleCheck, 'warning': 'WarningFilled' };
  return map[type] || InfoFilled;
}
</script>

<style lang="scss" scoped>
.comparison-result {
  display: flex;
  flex-direction: column;
  gap: 24px;

  .result-overview {
    .overview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .best-match {
      display: flex;
      align-items: center;
      gap: 32px;
      padding: 24px;
      background: linear-gradient(135deg,
          rgba(99, 102, 241, 0.1) 0%,
          rgba(20, 184, 166, 0.1) 100%
      );
      border-radius: 12px;
      margin-bottom: 24px;

      &__icon {
        color: var(--ai-accent);
        animation: pulse-glow 2s infinite;
      }

      &__value {
        font-size: 36px;
        font-weight: 700;
        color: var(--ai-primary);
        margin: 8px 0;
      }

      &__score {
        font-size: 18px;
        color: var(--ai-text-secondary);
      }
    }

    .model-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      color: var(--ai-text-secondary);
    }
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }

  .detailed-analysis {
    .analysis-process {
      margin-bottom: 48px;

      h4 {
        margin: 0 0 24px 0;
        color: var(--ai-text-primary);
      }

      .timeline-content {
        h5 {
          margin: 0 0 8px 0;
          color: var(--ai-text-primary);
        }

        p {
          margin: 0 0 12px 0;
          color: var(--ai-text-secondary);
        }
      }
    }

    .comparison-charts {
      margin-bottom: 48px;

      h4 {
        margin: 0 0 24px 0;
        color: var(--ai-text-primary);
      }
    }

    .score-details {
      h4 {
        margin: 0 0 24px 0;
        color: var(--ai-text-primary);
      }

      .column-header {
        display: flex;
        align-items: center;
        gap: 8px;

        .el-icon {
          color: var(--ai-text-muted);
          cursor: help;
        }
      }

      .score-cell {
        .score-value {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: var(--ai-text-secondary);
        }
      }
    }
  }

  .result-explanation {
    .explanation-content {
      h4 {
        margin: 0 0 24px 0;
        color: var(--ai-text-primary);
      }
    }

    .reason-cards {
      display: grid;
      gap: 16px;
      margin-bottom: 48px;
    }

    .reason-card {
      display: flex;
      gap: 16px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);

      .reason-icon {
        flex-shrink: 0;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(99, 102, 241, 0.1);
        border-radius: 12px;
        color: var(--ai-primary);
      }

      .reason-content {
        flex: 1;

        h5 {
          margin: 0 0 8px 0;
          color: var(--ai-text-primary);
        }

        p {
          margin: 0 0 12px 0;
          color: var(--ai-text-secondary);
          line-height: 1.6;
        }
      }

      .reason-evidence {
        display: flex;
        align-items: center;
        gap: 8px;

        .evidence-label {
          color: var(--ai-text-muted);
          font-size: 14px;
        }
      }
    }

    .recommendations {
      .el-alert {
        margin-bottom: 12px;
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(255, 255, 255, 0.1);

        :deep(.el-alert__title) {
          color: var(--ai-text-primary);
        }

        :deep(.el-alert__description) {
          color: var(--ai-text-secondary);
        }
      }
    }
  }
}

// 深色主题适配
:deep(.el-table) {
  background: transparent;

  th.el-table__cell {
    background: rgba(255, 255, 255, 0.05);
    color: var(--ai-text-primary);
  }

  tr {
    background: transparent;

    &:hover > td.el-table__cell {
      background: rgba(255, 255, 255, 0.05);
    }
  }

  td.el-table__cell {
    border-color: rgba(255, 255, 255, 0.05);
    color: var(--ai-text-secondary);
  }
}

:deep(.el-timeline-item__wrapper) {
  .el-timeline-item__tail {
    border-color: rgba(255, 255, 255, 0.1);
  }
}
</style>