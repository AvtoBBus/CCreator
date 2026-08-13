import type { ReactComponentType, Scripts, Styles, Template } from "../shared/types";
import { upperFirstLetter } from "../shared/utils";

const helloStr = "Hello from CCreator!";

const generateSvelte = (script: Scripts, style: Styles) => {
    return `<script${script === 'ts' ? ' lang="ts"' : ''}>
</script>

<div>
    ${helloStr}
</div>

<style${style === 'css' ? '' : ` lang="${style}"`}>
</style>`;
};

const generateReact = (fileName: string, componentType: ReactComponentType) => {
    const componentName = upperFirstLetter(fileName);

    if (componentType === 'class') {
        return `import React, { Component } from 'react';

class ${componentName} extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() { }

    componentWillUnmount() { }

    render() {
        return (
            <div>
                ${helloStr}
            </div>
        );
    }
}

export default MyComponent;`;
    }
    
    return `import React from 'react';

const ${componentName} = () => {
    return <>
        ${helloStr}
    </>
};

export default ${componentName}`;
};

const generateVue = (fileName: string, script: Scripts, style: Styles) => {
    return `<template>
    <div class="${fileName}">
        ${helloStr}
    </div>
</template>

<script setup${script === 'ts' ? ' lang="ts"' : ''}>
    import { ref } from 'vue'

    defineProps({ })
</script>

<style scoped${style === 'css' ? '' : ` lang="${style}"`}>
    .my-component {
        padding: 20px;
    }
</style>`;
};

const generateAngular = (fileName: string) => {
    const componentName = upperFirstLetter(fileName);
    return `import { Component, Input } from '@angular/core';

@Component({
    selector: '${componentName}',
    standalone: true,
    imports: [],
    template: '<div class="${componentName}">${helloStr}</div>',
    styles: []
})
export class ${componentName} {}`; 
};

const generateNextJS = (fileName: string) => {
    const componentName = upperFirstLetter(fileName);
    return `import React from 'react';

interface ${componentName}Props {
  params: Promise<{ id?: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ${componentName}({ params, searchParams }: ${componentName}Props) {
  const resolvedParams = await params;
  
  return (
    <div class="${componentName}">${helloStr}</div>
  );
}`;
};

const generateElectron = () => {
    return `const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});`;
};

const generateNestJS = (fileName: string) => {
    const componentName = upperFirstLetter(fileName);
    return `import { Controller, Get, Post, Body, Param } from '@nestjs/common';

@Controller('${fileName}')export class ${componentName}Controller {
  @Get()
  findAll() {
    return { data: 'Список всех элементов' };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { id, data: 'Элемент с id ' + id };
  }

  @Post()
  create(@Body() createDto: any) {
    return { message: 'Создано успешно', data: createDto };
  }
}`;
};

const generateFastAPI = () => {
    return `from fastapi import FastAPIfrom fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CCreator FastAPI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "${helloStr}"}`;
};

const generateDjango = (fileName: string) => {
    const componentName = upperFirstLetter(fileName);
    return `from django.http import JsonResponsefrom django.views import View

class ${componentName}View(View):
    def get(self, request, *args, **kwargs):
        data = [
            {"id": 1, "name": "Первый товар"},
            {"id": 2, "name": "Второй товар"}
        ]
        return JsonResponse(data, safe=False)

    def post(self, request, *args, **kwargs):
        return JsonResponse({"status": "success", "message": "Создано"}, status=201)`;
};

const generateSpringBoot = (fileName: string) => {
    const componentName = upperFirstLetter(fileName);
    return `package com.example.ccreator.controller;
import org.springframework.http.ResponseEntity;import org.springframework.web.bind.annotation.*;import java.util.HashMap;import java.util.Map;

@RestController
@RequestMapping("/api/${fileName}")public class ${componentName}Controller {

    @getMapping("/status")
    public ResponseEntity<Map<String, String>> getStatus() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("framework", "Spring Boot");
        return ResponseEntity.ok(status);
    }
}`;
};

const generateLaravel = (fileName: string) => {
    const componentName = upperFirstLetter(fileName);
    return `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Http\\JsonResponse;

class ${componentName}Controller extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'framework' => 'Laravel'
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        return response()->json(['message' => 'Создано', 'data' => $validated], 201);
    }
}`;
};

const generateFlutter = (fileName: string) => {
    const componentName = upperFirstLetter(fileName);
    return `import 'package:flutter/material.dart';
class ${componentName} extends StatelessWidget {
  final String title;

  const ${componentName}({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Text(
          title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}`;
};

const generateExpress = () => {
    return `const express = require('express');const app = express();const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: '${helloStr}' });
});

app.listen(PORT, () => {
  console.log('Сервер запущен на http://localhost:' + PORT);
});`;
};

const generateActix = () => {
    return `use actix_web::{get, App, HttpResponse, HttpServer, Responder};

@get("/")async fn hello() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({ "message": "${helloStr}" }))
}

#[actix_web::main]async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new().service(hello)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}`;
};

export const templates: Record<string, Template> = {
    "svelte-ts-scss": () => generateSvelte('ts', 'scss'),
    "svelte-ts-less": () => generateSvelte('ts', 'less'),
    "svelte-ts-css": () => generateSvelte('ts', 'css'),
    "svelte-js-scss": () => generateSvelte('js', 'scss'),
    "svelte-js-less": () => generateSvelte('js', 'less'),
    "svelte-js-css": () => generateSvelte('js', 'css'),

    "react-class": (fileName: string) => generateReact(fileName, 'class'),
    "react-function": (fileName: string) => generateReact(fileName, 'function'),

    'vue-ts-scss': (fileName: string) => generateVue(fileName, 'ts', 'scss'),
    'vue-ts-less': (fileName: string) => generateVue(fileName, 'ts', 'less'),
    'vue-ts-css': (fileName: string) => generateVue(fileName, 'ts', 'css'),
    'vue-js-scss': (fileName: string) => generateVue(fileName, 'js', 'scss'),
    'vue-js-less': (fileName: string) => generateVue(fileName, 'js', 'less'),
    'vue-js-css': (fileName: string) => generateVue(fileName, 'js', 'css'),

    'angular': (fileName: string) => generateAngular(fileName),

    'next-js': (fileName: string) => generateNextJS(fileName),

    'electron': () => generateElectron(),

    'nest-js': (fileName: string) => generateNestJS(fileName),

    'fast-api': () => generateFastAPI(),

    'django': (fileName: string) => generateDjango(fileName),

    'spring-boot': (fileName: string) => generateSpringBoot(fileName),

    'laravel': (fileName: string) => generateLaravel(fileName),

    'flutter': (fileName: string) => generateFlutter(fileName),

    'express': () => generateExpress(),

    'actix': () => generateActix()
};