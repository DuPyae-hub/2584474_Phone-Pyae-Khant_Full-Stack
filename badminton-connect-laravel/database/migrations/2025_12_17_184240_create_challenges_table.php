<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('challenges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('challenger_id');
            $table->foreign('challenger_id')->references('id')->on('profiles')->onDelete('cascade');
            $table->uuid('challenged_id');
            $table->foreign('challenged_id')->references('id')->on('profiles')->onDelete('cascade');
            $table->enum('status', ['pending', 'accepted', 'rejected', 'expired'])->default('pending');
            $table->uuid('court_id')->nullable();
            $table->foreign('court_id')->references('id')->on('courts')->onDelete('set null');
            $table->date('proposed_date');
            $table->time('proposed_time');
            $table->text('message')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
            $table->check('challenger_id != challenged_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('challenges');
    }
};
