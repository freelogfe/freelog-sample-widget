<script setup lang="ts">
defineProps<{
  reportSubmitting: boolean;
  reportSuccess: boolean;
}>();

const reportReason = defineModel<string>("reportReason", { required: true });
const reportDetail = defineModel<string>("reportDetail", { required: true });

const emit = defineEmits<{
  cancel: [];
  submit: [];
}>();
</script>

<template>
  <div class="report-panel-body">
    <div class="report-header">
      <h3>举报</h3>
      <div class="button-group">
        <button type="button" class="btn btn-secondary" @click="emit('cancel')">取消</button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="reportSubmitting || reportSuccess"
          @click="emit('submit')"
        >
          提交
        </button>
      </div>
    </div>

    <div class="report-content">
      <div
        class="report-option"
        :class="{ active: reportReason === 'spam' }"
        @click="reportReason = 'spam'"
      >
        <span>垃圾内容或违规商业推广</span>
        <div class="radio" :class="{ checked: reportReason === 'spam' }">
          <div v-if="reportReason === 'spam'" class="radio-dot"></div>
        </div>
      </div>

      <div
        class="report-option"
        :class="{ active: reportReason === 'violence' }"
        @click="reportReason = 'violence'"
      >
        <span>色情、暴力</span>
        <div class="radio" :class="{ checked: reportReason === 'violence' }">
          <div v-if="reportReason === 'violence'" class="radio-dot"></div>
        </div>
      </div>

      <div
        class="report-option"
        :class="{ active: reportReason === 'harassment' }"
        @click="reportReason = 'harassment'"
      >
        <span>骚扰、欺诈</span>
        <div class="radio" :class="{ checked: reportReason === 'harassment' }">
          <div v-if="reportReason === 'harassment'" class="radio-dot"></div>
        </div>
      </div>

      <div
        class="report-option"
        :class="{ active: reportReason === 'false' }"
        @click="reportReason = 'false'"
      >
        <span>不实信息</span>
        <div class="radio" :class="{ checked: reportReason === 'false' }">
          <div v-if="reportReason === 'false'" class="radio-dot"></div>
        </div>
      </div>

      <div
        class="report-option"
        :class="{ active: reportReason === 'other' }"
        @click="reportReason = 'other'"
      >
        <span>其他</span>
        <div class="radio" :class="{ checked: reportReason === 'other' }">
          <div v-if="reportReason === 'other'" class="radio-dot"></div>
        </div>
      </div>

      <template v-if="reportReason === 'other'">
        <p class="hint">请填写举报理由（必填）</p>
        <textarea
          v-model="reportDetail"
          class="report-detail"
          placeholder="请详细描述..."
        ></textarea>
      </template>
    </div>

    <Transition name="fade">
      <div v-if="reportSuccess" class="drawer-report-success">举报已受理</div>
    </Transition>
  </div>
</template>

<style src="./ReportPanel.css"></style>
