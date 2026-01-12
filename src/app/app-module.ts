import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { MemeCardComponent } from './shared/components/meme-card/meme-card.component';
import { MemeGalleryComponent } from './pages/meme-gallery/meme-gallery.component';
import { MemeDetailComponent } from './pages/meme-detail/meme-detail.component';
import { UploadZone } from './shared/components/upload-zone/upload-zone';
import { CreateMeme } from './pages/create-meme/create-meme';
import { Navbar } from './shared/components/navbar/navbar';
import { SearchBar } from './shared/components/search-bar/search-bar';
import { TagChip } from './shared/components/tag-chip/tag-chip';
import { Spinner } from './shared/components/spinner/spinner';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ToastNotification } from './shared/components/toast-notification/toast-notification';
import { AdminMemesComponent } from './pages/admin/admin-memes/admin-memes';
import { AdminTagsComponent } from './pages/admin/admin-tags/admin-tags';
import { MyDrafts } from './pages/my-drafts/my-drafts';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MemeCardComponent,
    MemeGalleryComponent,
    MemeDetailComponent,
    UploadZone,
    CreateMeme,
    Navbar,
    SearchBar,
    TagChip,
    Spinner,
    AuthCallbackComponent,
    ProfileComponent,
    ToastNotification,
    AdminMemesComponent,
    AdminTagsComponent,
    MyDrafts
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }