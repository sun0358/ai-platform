<script setup lang="ts">

</script>

<template>
  <el-card>
    <template #header>
      <span>注册</span>
    </template>

    <el-form label-width="80px">
      <el-form-item label="用户名">
        <el-input v-model="username" placeholder="请输入用户名"></el-input>
      </el-form-item>
      <el-form-item label="密码">
        <el-input type="password" v-model="password" placeholder="请输入密码"></el-input>
      </el-form-item>
      <el-form-item label="确认密码">
        <el-input type="password" v-model="confirmPassword" placeholder="请再次输入密码"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="register">注册</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">

</style>