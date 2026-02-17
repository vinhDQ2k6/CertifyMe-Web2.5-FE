<script setup>
defineProps({
    verificationHash: {
        type: String,
        default: ''
    },
    blockNumber: {
        type: String,
        default: ''
    },
    transactionHash: {
        type: String,
        default: ''
    },
    contractAddress: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        default: 'PENDING',
        validator: (val) => ['ISSUED', 'REVOKED', 'PENDING'].includes(val)
    }
});

function truncateHash(hash) {
    if (!hash || hash.length <= 16) return hash;
    return hash.slice(0, 10) + '...' + hash.slice(-6);
}

function getStatusSeverity(status) {
    switch (status) {
        case 'ISSUED':
            return 'success';
        case 'REVOKED':
            return 'danger';
        default:
            return 'warn';
    }
}
</script>

<template>
    <Card>
        <template #title>
            <span class="text-lg font-semibold">🔗 Blockchain Verification</span>
        </template>
        <template #content>
            <div class="flex flex-col gap-4">
                <div class="flex items-center gap-2">
                    <span class="font-medium w-28">🔗 Hash:</span>
                    <span class="text-muted-color font-mono">{{ truncateHash(verificationHash) }}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-medium w-28">📦 Block:</span>
                    <span class="text-muted-color">{{ blockNumber }}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-medium w-28">💳 Tx Hash:</span>
                    <span class="text-muted-color font-mono">{{ truncateHash(transactionHash) }}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-medium w-28">📍 Contract:</span>
                    <span class="text-muted-color font-mono">{{ truncateHash(contractAddress) }}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-medium w-28">Status:</span>
                    <Tag :value="status" :severity="getStatusSeverity(status)" />
                </div>
            </div>
        </template>
    </Card>
</template>
