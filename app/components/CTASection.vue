<script setup lang="ts">
import { ref } from 'vue';

const email = ref('');
const isSubmitting = ref(false);
const isSubmitted = ref(false);
const error = ref('');

async function handleSubmit() {
  if (!email.value || !email.value.includes('@')) {
    error.value = 'Please enter a valid email address';
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  // Simulate API call - replace with actual waitlist integration
  await new Promise(resolve => setTimeout(resolve, 1000));

  isSubmitted.value = true;
  isSubmitting.value = false;
}
</script>

<template>
  <section id="get-started" class="py-20 relative">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- CTA Card -->
      <div class="relative p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-space-950 to-terminal-surface border border-space-500/20 glow-violet">
        <!-- Background decoration -->
        <div class="absolute inset-0 rounded-2xl overflow-hidden">
          <div class="absolute top-0 right-0 w-64 h-64 bg-space-500/10 rounded-full blur-3xl" />
          <div class="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
        </div>

        <div class="relative text-center space-y-6">
          <div class="inline-flex items-center gap-2 badge-amber">
            <Icon name="mdi:rocket-launch" class="w-4 h-4" />
            <span>Early Access</span>
          </div>

          <h2 class="text-3xl sm:text-4xl font-bold text-white">
            Be the First to
            <span class="gradient-text">Automate with Nika</span>
          </h2>

          <p class="text-terminal-muted text-lg max-w-xl mx-auto">
            Join the waitlist for early access. Get notified when we launch and be part of shaping the future of agentic workflows.
          </p>

          <!-- Waitlist form -->
          <div v-if="!isSubmitted" class="max-w-md mx-auto">
            <form class="flex flex-col sm:flex-row gap-3" @submit.prevent="handleSubmit">
              <input
                v-model="email"
                type="email"
                placeholder="you@example.com"
                class="flex-1 px-4 py-3 rounded-lg bg-terminal-bg border border-terminal-border text-white placeholder:text-terminal-muted focus:outline-none focus:border-space-500 transition-colors"
                :disabled="isSubmitting"
              />
              <button
                type="submit"
                class="btn-primary whitespace-nowrap"
                :disabled="isSubmitting"
              >
                <Icon v-if="isSubmitting" name="mdi:loading" class="w-5 h-5 animate-spin" />
                <template v-else>
                  <Icon name="mdi:email-plus" class="w-5 h-5" />
                  Join Waitlist
                </template>
              </button>
            </form>
            <p v-if="error" class="mt-2 text-red-400 text-sm">{{ error }}</p>
          </div>

          <!-- Success state -->
          <div v-else class="bg-terminal-green/10 border border-terminal-green/30 rounded-lg p-6 max-w-md mx-auto">
            <div class="flex items-center justify-center gap-3 text-terminal-green">
              <Icon name="mdi:check-circle" class="w-6 h-6" />
              <span class="font-medium">You're on the list!</span>
            </div>
            <p class="mt-2 text-terminal-muted text-sm">
              We'll notify you when Nika is ready. In the meantime, star us on GitHub!
            </p>
          </div>

          <!-- Additional links -->
          <div class="flex flex-wrap items-center justify-center gap-6 pt-4">
            <a
              href="https://github.com/SuperNovae-studio/nika"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 text-terminal-muted hover:text-white transition-colors"
            >
              <Icon name="mdi:github" class="w-5 h-5" />
              <span>Star on GitHub</span>
            </a>
            <a
              href="https://github.com/SuperNovae-studio/nika/discussions"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 text-terminal-muted hover:text-white transition-colors"
            >
              <Icon name="mdi:forum" class="w-5 h-5" />
              <span>Join Discussion</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
