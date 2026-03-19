<script setup>
defineProps({
    totalRecords: {
        type: Number,
        default: 0
    },
    rows: {
        type: Number,
        default: 10
    },
    first: {
        type: Number,
        default: 0
    },
    rowsPerPageOptions: {
        type: Array,
        default: () => [5, 10, 20, 50]
    }
});

const emit = defineEmits(['page']);

function onPage(event) {
    emit('page', event);
}
</script>

<template>
    <Paginator
        :totalRecords="totalRecords"
        :rows="rows"
        :first="first"
        :rowsPerPageOptions="rowsPerPageOptions"
        @page="onPage"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
        currentPageReportTemplate="{first} - {last} / {totalRecords} mục"
    />
</template>
